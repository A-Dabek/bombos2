# ADR-033: Finanse — Paginate Monthly Periods (last 3 months + "Więcej")

## Status

Accepted (2026-09-13) — implementation plan.

## Context

The Finanse (`/money/*`) views render every monthly period group the household
has ever recorded. In production this makes Bills, Wydatki (Balance) and
Kieszonkowe (Allowance) pages long and payload-heavy: the three GET endpoints
return **all** period groups on every load.

Requirements from the user:

- Fetch only the **last 3 months** on initial load, for **Bills**, **Wydatki**
  (Balance) and **Kieszonkowe** (Allowance).
- Provide a **"load more" button** that loads the **next 3 months**.
- The "Przepływy" (Flows) tab is explicitly out of scope — pagination makes no
  sense there.

The UI already models data as monthly **period groups** (defined by
`'Period start'` markers for Bills/Balance and `is_automatic` allowance markers
for Allowance), already ordered newest-first. This is the natural pagination
unit — not strict calendar months.

## Decision

### "3 months" means 3 most recent period groups

Pagination operates on the ordered group list, `PAGE_SIZE = 3`. This is
deterministic, matches the domain model, and keeps existing e2e fixtures valid
(e.g. Allowance history seeded for May/June 2025 must remain visible).

Rejected: filtering by `created_at >= now - 3 months`, which would hide older
seeded periods and break existing tests.

### Paginate by slicing already-built groups (no schema/DB-semantics change)

Grouping must scan all transactions ASC anyway to assign rows to periods and to
fold automatic-payment summaries. Rather than re-querying per page, the existing
`get*GroupedByPeriod()` functions are reused unchanged and their result is
sliced.

New pure helper `src/db/pagination.ts`:

```ts
export interface GroupPage<T> { groups: T[]; hasMore: boolean; }

export function paginateGroups<T>(all: T[], limit: number, offset = 0): GroupPage<T> {
  const slice = all.slice(offset, offset + limit + 1); // limit+1 probe
  const hasMore = slice.length > limit;
  return { groups: hasMore ? slice.slice(0, limit) : slice, hasMore };
}
```

The `limit + 1` probe derives `hasMore` without a count query. Placed under
`src/db/` so the existing `pnpm test.db` (`vitest run src/db`) picks up its test.

### API — optional `limit`/`offset` query params

Updated GET handlers: `src/routes/api/bills/transactions/index.ts`,
`.../balance/transactions/index.ts`, `.../allowance/transactions/index.ts`.

- `limit` absent → return all groups, `hasMore: false` (backward compatible).
- `limit`/`offset` present → validate/clamp (`limit` 1..100, `offset >= 0`), then
  `paginateGroups(groups, limit, offset)`.
- Bills/Balance respond `{ groups, hasMore }`.
- Allowance responds `{ groups, balance, lastTransactionId, hasMore }`;
  `balance` and `lastTransactionId` remain global and are computed independently
  of pagination.

### UI

New shared leaf component `src/components/shared/LoadMoreButton.tsx`
(`data-testid="load-more-btn"`, Polish labels `Więcej` / `Ładowanie...`).

For `BillsPage.tsx`, `BalancePage.tsx`, `AllowancePage.tsx`:

- Signals: `hasMore`, `loadedCount` (init `PAGE_SIZE`).
- Initial load + refresh: fetch `?limit=loadedCount&offset=0`, **replace**
  groups. `loadedCount` is preserved across a refresh signal / transaction add,
  so a user who loaded 6 months keeps 6 after adding a row.
- Load more: fetch `?limit=PAGE_SIZE&offset=groups.length`, **append** groups,
  update `hasMore` and `loadedCount`.
- Render `<LoadMoreButton>` below the list only when `hasMore`.
- Allowance keeps config fetching in `loadData()` only; `loadMore()` must not
  refetch config.

## Alternatives considered

- **Calendar-month filtering (`created_at >= now - 3 months`).** Rejected — does
  not fit the period model and breaks existing fixtures/users with older data.
- **Client-side slicing of the full payload.** Rejected — does not reduce the
  payload, which is the core goal.
- **Timestamp cursor (`before=<oldest periodStartTs>`).** More robust to
  concurrent inserts but more complex; group offset is sufficient for a
  single-household app and refresh resets cleanly. Revisit only if offset drift
  becomes observable.
- **Push the slice into the DB functions.** Rejected as unnecessary: grouping
  already scans all rows, so slicing after build adds no measurable cost and
  keeps existing function signatures/tests untouched.
- **Extend pagination to Flows.** Rejected — explicitly out of scope.

## Consequences

Positive:
- Initial payload and DOM shrink to 3 periods per finance tab.
- No migration, no schema change, no change to grouping or automatic-payment
  logic.
- Existing DB functions and their tests remain valid; pagination is additive.
- Refresh preserves user context (loaded depth).

Negative / trade-offs:
- The DB still reads all transactions per request (grouping requires it); only
  the response is trimmed.
- Offset is by group, not timestamp; concurrent inserts between requests can
  shift offsets. Acceptable for a household app; refresh resets.
- A `periodStartTs = 0` default group (rows before any marker) is treated as the
  oldest group and surfaces only after load-more — no special casing.

## Files added / changed

- `src/db/pagination.ts` — new pure helper.
- `src/db/pagination.test.ts` — unit tests (exact-3, 4+, offset stepping, empty).
- `src/routes/api/bills/transactions/index.ts` — `limit`/`offset` + `hasMore`.
- `src/routes/api/balance/transactions/index.ts` — same.
- `src/routes/api/allowance/transactions/index.ts` — same, preserving
  `balance`/`lastTransactionId`.
- `src/components/shared/LoadMoreButton.tsx` — new.
- `src/components/bills/BillsPage.tsx`, `src/components/balance/BalancePage.tsx`,
  `src/components/allowance/AllowancePage.tsx` — pagination state + button.
- `e2e/money-allowance.spec.ts`, `e2e/bills.spec.ts` — load-more journey tests
  (seed 5 periods → 3 headers, click → 5, button hidden).
- `knowledge/db/modules/{bills,balance,allowance}.md` — API-contract notes.

## Verification

- `pnpm test.db` (new pagination unit tests).
- `pnpm build.types`; `pnpm exec qwik check-client src dist`.
- `pnpm e2e` (existing specs unaffected at ≤3 seeded groups + new load-more
  specs).
