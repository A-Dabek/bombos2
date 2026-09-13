# ADR-032: Bills — Aggregate Automatic Payments into a Single "Stałe opłaty" Row

## Status

Accepted (2026-09-13) — implementation plan.

## Context

In production the Bills list contains many pre-defined automatic payments
(rent, utilities, etc.) that are generated at the start of every period. With
so many of them, they constitute the majority of rows in each month's view,
making the list long and the payload heavy.

Requirements from the user:

- See all automatic payments of a month summed up into **one** line item,
  e.g. "Stałe opłaty -1234", instead of N separate rows.
- The summary row must always be shown **last** within the month.
- A button **below** the summary expands it: clicking fetches all automatic
  payments **for that month only** — each month is expandable independently.
- Do the aggregation server-side to keep the main payload small and the UI
  simple.
- Polish UI: the summary label is "Stałe opłaty".
- No client-side caching of expanded rows: every expand refetches.

## Decision

### Identification rule — keep `is_automatic` as-is, aggregate by slug

`is_automatic` is intentionally reserved for `'Period start'` markers
(`amount = 0`). Auto-generated payment transactions are stored with
`is_automatic = 0` and are identified by `predefined_slug` being a member of
`bills_automatic_payments.slug`. We keep this behaviour unchanged and use the
**slug-membership rule** for aggregation — the same rule already used by
`shouldAddAutomaticPayments` and `isBillsUrgent`.

No migration, no schema change, no change to the scheduler or generation
logic.

### 1. DB layer (`src/db/bills.ts`)

- Add `BillsAutomaticSummary { count: number; total: number }` (`total` is a
  negative sum) and `automatic: BillsAutomaticSummary | null` to
  `BillsTransactionGroup`.
- In `getBillTransactionsGroupedByPeriod`:
  - Build the auto-slug set once: `SELECT slug FROM bills_automatic_payments`.
  - Any transaction whose `predefined_slug` is in the set is excluded from
    `transactions` and folded into the period's `automatic` summary
    (`count++`, `total += amount`).
  - Rows without an auto slug behave exactly as today.
  - Result: the main `GET /api/bills/transactions` payload no longer carries
    individual auto rows — lower payload by construction.
- Add `getAutomaticPaymentsForPeriod(startTs, endTs, db?)`:
  - `SELECT ... FROM bills_transactions WHERE predefined_slug IN (SELECT slug
    FROM bills_automatic_payments) AND created_at >= ? AND created_at < ?`
    `ORDER BY created_at DESC, id DESC`.
- Do NOT touch `is_automatic` semantics, `isBillsUrgent`,
  `shouldAddAutomaticPayments`, or the scheduler.

### 2. API

New route `src/routes/api/bills/transactions/automatic/index.ts`:

- `onGet` with query params `start`, `end` (numeric, validated, `start < end`).
- Calls `getAutomaticPaymentsForPeriod(start, end)`, returns `{ transactions }`.

### 3. UI (`src/components/bills/`)

Per month group, rendered in order:

```
PeriodHeader
<manual transaction rows>
Stałe opłaty   -1234        <- summary row, always last
  [Rozwiń (N)]               <- button below the summary
  (expanded: individual rows + [Zwiń])
```

- `AutomaticPaymentsSection.tsx` (new):
  - Renders the summary row "Stałe opłaty" + raw total, styled like a
    `TransactionLine` (plain negative number).
  - Renders `Rozwiń (N)` button below it (`data-testid="automatic-expand-btn"`).
  - On click: fetch `/api/bills/transactions/automatic?start=&end=` for that
    month only, show individual `TransactionLine`s and a `Zwiń` button.
  - **No caching**: collapsing clears the rows; every expand refetches.
- `BillsTransactionGroup.tsx` (new): bills-only wrapper composing the shared
  `TransactionGroup` (untouched — Balance is unaffected) plus the automatic
  section.
- `BillsPage.tsx`: pass `automatic` (null → section omitted) and the
  now-manual-only `transactions` to the wrapper.

The summary row is always the last row of the month by construction (it is
rendered after all manual rows).

### 4. Tests

- Unit (`src/db/bills.test.ts`, `:memory:` + `runMigrations`):
  - Multiple auto rows sum correctly into `automatic` (count + negative total)
    and are absent from `transactions`.
  - Period marker (`is_automatic = 1, amount = 0`) is never counted.
  - No auto payments → `automatic: null`.
  - `getAutomaticPaymentsForPeriod` respects boundaries and ordering.
- E2E (`e2e/bills.spec.ts` + a `setup.ts` helper inserting a transaction with
  `predefined_slug` and `created_at`):
  - One month → exactly one "Stałe opłaty" summary with the correct total.
  - Expand fetches `/api/bills/transactions/automatic` and shows individual
    rows; collapse clears them; re-expand refetches.
  - Two months → independent summaries and independent expansion state.

### 5. Docs

- `knowledge/db/modules/bills.md` — new function + grouping behaviour note.
- `knowledge/ui/components/bills.md` — new components.
- `knowledge/features/modules/bills.md` — aggregation capability.

## Alternatives considered

- **Use the `is_automatic` flag as the aggregation rule.** Rejected. The flag
  is intentionally reserved for period-start markers; auto payments are stored
  `is_automatic = 0` and flipping generation + backfilling production data
  would change semantics and break the marker-detection logic. The slug rule
  is the existing de-facto identifier and keeps behaviour consistent.
- **Expand all months eagerly on page load.** Rejected — defeats the payload
  goal.
- **Client-side filtering of the existing flat payload.** Rejected — the whole
  point is to stop shipping N auto rows in the first place.
- **A single global "expand all" button.** Rejected — per-month expansion was
  explicitly requested.

## Consequences

Positive:
- Much shorter month lists and a smaller main payload in production.
- Consistent with existing slug-based logic (`isBillsUrgent`,
  `shouldAddAutomaticPayments`).
- Per-month lazy expansion keeps each expand request tiny.
- Balance module unaffected (shared `TransactionGroup` untouched).

Negative / trade-offs:
- Every expand re-fetches (no cache) — acceptable per requirement.
- Known pre-existing limitation: a manually entered bill whose `predefined_slug`
  collides with an automatic-payment slug would fold into "Stałe opłaty" — the
  same rule `isBillsUrgent` already applies, so behaviour is consistent.

## Files added / changed

- `src/db/bills.ts` — `BillsAutomaticSummary`, `automatic` on
  `BillsTransactionGroup`, aggregation in `getBillTransactionsGroupedByPeriod`,
  new `getAutomaticPaymentsForPeriod`.
- `src/routes/api/bills/transactions/automatic/index.ts` — new expand endpoint.
- `src/components/bills/AutomaticPaymentsSection.tsx` — new.
- `src/components/bills/BillsTransactionGroup.tsx` — new.
- `src/components/bills/BillsPage.tsx` — pass `automatic`, use wrapper.
- `src/db/bills.test.ts` — unit tests.
- `e2e/bills.spec.ts`, `e2e/setup.ts` — e2e tests + helper.
- `knowledge/db/modules/bills.md`, `knowledge/ui/components/bills.md`,
  `knowledge/features/modules/bills.md` — doc updates.
