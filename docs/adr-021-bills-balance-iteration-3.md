# ADR-021: Bills & Balance Modules — Iteration 3 (Period Grouping)

## Status
Proposed (2026-05-05)

## Context
ADR-019 (Iteration 1) delivered the foundation: transaction form (`TransactionForm.tsx`), flat transaction list (`TransactionLine.tsx`), and separate DB tables.

ADR-020 (Iteration 2) added: admin page (configure `day_of_month`), scheduler (automatic period-start transactions with `amount=0, is_automatic=true`), and the `is_automatic` column.

**What's in place:**
- Period-start markers are inserted by the scheduler on `day_of_month` each month
- Seed data: May 15, 2026 period-start marker exists in both tables (with migration bug fixed below)
- `getBillTransactions(include_automatic=false)` filters out period markers from the flat list
- `checkAndAddBillsPeriodStart()` prevents duplicate markers within a period
- `getOrdinal()` extracted to `src/utils/date.ts` and used by `allowance.ts`

**Iteration 3 adds:**
1. **Period grouping** — group transactions by period-start markers
2. **`PeriodHeader` component** — render `"May 15th – June 15th"` descriptive labels
3. **`getBillTransactionsGroupedByPeriod()`** — DB function to group transactions by periods
4. **Updated API + Page** — return/render grouped data instead of flat list

## Decision

### 1. Fix Migrations — Seed Data Bug

The seed INSERT in `015_add_is_automatic_bills.sql` and `016_add_is_automatic_balance.sql` uses `INSERT OR IGNORE` which **doesn't work** without a UNIQUE constraint. Fix:

**Updated `src/db/migrations/015_add_is_automatic_bills.sql`:**
```sql
-- ADR-020 Iteration 2: Add is_automatic column to bills_transactions
ALTER TABLE bills_transactions ADD COLUMN is_automatic INTEGER NOT NULL DEFAULT 0;

-- Seed initial period marker: May 15, 2026 (start of known period)
-- Use WHERE NOT EXISTS to avoid duplicate seeds on re-run
INSERT INTO bills_transactions (description, amount, is_automatic, created_at)
SELECT 'Period start', 0, 1, strftime('%s', '2026-05-15')
WHERE NOT EXISTS (
  SELECT 1 FROM bills_transactions WHERE is_automatic = 1
);
```

**Updated `src/db/migrations/016_add_is_automatic_balance.sql`:**
```sql
-- ADR-020 Iteration 2: Add is_automatic column to balance_transactions
ALTER TABLE balance_transactions ADD COLUMN is_automatic INTEGER NOT NULL DEFAULT 0;

-- Seed initial period marker: May 15, 2026
INSERT INTO balance_transactions (description, amount, is_automatic, created_at)
SELECT 'Period start', 0, 1, strftime('%s', '2026-05-15')
WHERE NOT EXISTS (
  SELECT 1 FROM balance_transactions WHERE is_automatic = 1
);
```

---

### 2. Database Layer — Add Grouping Function

**Update `src/db/bills.ts`:**

Add import at top:
```ts
import { getOrdinal } from "~/utils/date";
```

Add interface and function:
```ts
export interface BillsTransactionGroup {
  periodLabel: string;        // "May 15th – June 15th"
  periodStartTs: number;       // for sorting
  transactions: BillsTransaction[];  // excludes is_automatic=1
}

export function getBillTransactionsGroupedByPeriod(
  db?: Database.Database,
): BillsTransactionGroup[] {
  const dbConn = db ?? getDb();

  // Get ALL transactions ASC (oldest first) for proper grouping
  const transactions = dbConn.prepare(
    "SELECT id, description, amount, is_automatic, created_at FROM bills_transactions ORDER BY id ASC",
  ).all() as BillsTransaction[];

  const groups: BillsTransactionGroup[] = [];
  let currentGroup: BillsTransactionGroup | null = null;

  for (const tx of transactions) {
    // Period-start marker: new group begins
    if (tx.is_automatic && tx.amount === 0) {
      const startDate = new Date(tx.created_at * 1000);
      const startDay = startDate.getDate();
      const startOrdinal = getOrdinal(startDay);
      const startMonth = startDate.toLocaleString("en-US", { month: "long" });

      // End date = same day next month
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDay = endDate.getDate();
      const endOrdinal = getOrdinal(endDay);
      const endMonth = endDate.toLocaleString("en-US", { month: "long" });

      const periodLabel = `${startMonth} ${startDay}${startOrdinal} – ${endMonth} ${endDay}${endOrdinal}`;

      currentGroup = {
        periodLabel,
        periodStartTs: tx.created_at,
        transactions: [],  // period markers are NOT included in the list
      };
      groups.push(currentGroup);
    } else if (currentGroup && !tx.is_automatic) {
      // Add to current group (only non-automatic transactions)
      currentGroup.transactions.push(tx);
    } else if (!currentGroup && !tx.is_automatic) {
      // No period marker yet: create a default group
      currentGroup = {
        periodLabel: "Transactions",
        periodStartTs: 0,
        transactions: [],
      };
      groups.push(currentGroup);
      currentGroup.transactions.push(tx);
    }
    // If no group and tx is_automatic (but not amount=0), skip it
  }

  // Reverse groups so newest period appears first (for UI)
  groups.reverse();
  // Reverse transactions within each group so newest appears first
  for (const group of groups) {
    group.transactions.reverse();
  }

  return groups;
}
```

**`src/db/balance.ts`** — identical changes:
- Add `import { getOrdinal } from "~/utils/date";`
- Add `BalanceTransactionGroup` interface
- Add `getBalanceTransactionsGroupedByPeriod()` function

---

### 3. Shared UI Component — `PeriodHeader.tsx`

**`src/components/transactions/PeriodHeader.tsx`** (new):

```tsx
import { component$ } from "@builder.io/qwik";

interface PeriodHeaderProps {
  periodLabel: string;
}

export default component$<PeriodHeaderProps>(({ periodLabel }) => {
  return (
    <div data-testid="period-header" class="flex items-center gap-2 border-b border-gray-200 pb-1 mt-4">
      <span class="text-sm font-semibold text-gray-700">{periodLabel}</span>
    </div>
  );
});
```

Uses `data-testid="period-header"` to match Allowance's E2E test pattern.

---

### 4. Update API Routes — Return Groups

**`/api/bills/transactions/index.ts` — update GET:**

```ts
import { RequestHandler } from "@builder.io/qwik-city";
import { addBillTransaction, getBillTransactionsGroupedByPeriod } from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const groups = getBillTransactionsGroupedByPeriod();
  json(200, { groups });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  const id = addBillTransaction(description, amount, false);
  json(201, { id, description, amount });
};
```

**`/api/balance/transactions/index.ts`** — same update with `getBalanceTransactionsGroupedByPeriod()`.

---

### 5. Update Page Components — Render Groups

**`src/components/bills/BillsPage.tsx`** — update:

```tsx
import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BillsTransactionGroup } from "~/db/bills";
import TransactionLine from "~/components/transactions/TransactionLine";
import TransactionForm from "~/components/transactions/TransactionForm";
import PeriodHeader from "~/components/transactions/PeriodHeader";
import AdminButton from "~/components/shared/AdminButton";

export default component$(() => {
  const groups = useSignal<BillsTransactionGroup[]>([]);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const description = useSignal("");
  const amount = useSignal("");

  const loadData = $(async () => {
    try {
      const res = await fetch("/api/bills/transactions");
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = await res.json();
      groups.value = data.groups ?? [];
    } catch (e: any) {
      error.value = e.message;
    }
  });

  useVisibleTask$(async () => {
    await loadData();
  });

  const handleAdd = $(async (desc: string, amt: number) => {
    if (!desc || isNaN(amt) || amt === 0 || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/bills/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, amount: amt }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add transaction");
      }
      await loadData();
      description.value = "";
      amount.value = "";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="p-4">
      <AdminButton href="/money/bills/admin" />
      {error.value && <p class="mt-2 text-red-600">{error.value}</p>}

      <TransactionForm
        description={description.value}
        amount={amount.value}
        loading={loading.value}
        onSubmit$={handleAdd}
      />

      {groups.value.length > 0 && (
        <div class="mt-6 space-y-4">
          {groups.value.map((group) => (
            <div key={group.periodLabel}>
              <PeriodHeader periodLabel={group.periodLabel} />
              <div class="divide-y divide-gray-100">
                {group.transactions.map((tx) => (
                  <TransactionLine
                    key={tx.id}
                    description={tx.description}
                    amount={tx.amount}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
```

**`src/components/balance/BalancePage.tsx`** — identical pattern with `BalanceTransactionGroup`.

---

### 6. No New DB Migration Needed

No schema changes in Iteration 3 — all required columns (`is_automatic`, `created_at`) and seed data (May 15, 2026) are already in place from Iterations 1 & 2. Only the migration seed bug fix in `015` and `016` needs to be applied.

---

## Consequences

### Positive
- **Full period visualization**: Transactions now grouped under descriptive `"May 15th – June 15th"` headers
- **Historical integrity**: Even if `day_of_month` config changes, past periods remain correctly labeled (period markers are timestamped)
- **Minimal new code**: Reuses `PeriodHeader`, `TransactionLine`, `TransactionForm` — only new code is the grouping algorithm
- **Consistent with Allowance**: Same `data-testid="period-header"` pattern, same grouping concept (but Bills/Balance use `amount=0` markers vs Allowance's `type='allowance'` markers)
- **No migration needed**: All DB changes were done in Iterations 1 & 2 (seed bug fix is backwards-compatible)

### Negative
- **Duplicated grouping logic**: `getBillTransactionsGroupedByPeriod()` and `getBalanceTransactionsGroupedByPeriod()` are near-identical (acceptable for "best bang for the buck")
- **Period label computation**: Date math in DB layer (not in SQL) — acceptable for this use case

### Risks
- **Date edge cases**: Period labels spanning year boundaries (e.g., "December 15th – January 15th") need verification in tests
- **No period markers yet**: If scheduler hasn't run and no seed data, all transactions fall under "Transactions" group (acceptable — will be fixed on first `day_of_month`)
- **Seed migration bug**: Original `INSERT OR IGNORE` doesn't work without UNIQUE constraint — fixed in this ADR

## Implementation Notes — Files

### New Files (1)
1. `src/components/transactions/PeriodHeader.tsx`

### Modified Files (6)
1. `src/db/migrations/015_add_is_automatic_bills.sql` — fix seed INSERT
2. `src/db/migrations/016_add_is_automatic_balance.sql` — fix seed INSERT
3. `src/db/bills.ts` — add `getBillTransactionsGroupedByPeriod()`, `BillsTransactionGroup` interface, import `getOrdinal`
4. `src/db/balance.ts` — add `getBalanceTransactionsGroupedByPeriod()`, `BalanceTransactionGroup` interface, import `getOrdinal`
5. `src/routes/api/bills/transactions/index.ts` — update GET to return `{ groups }`
6. `src/routes/api/balance/transactions/index.ts` — update GET to return `{ groups }`
7. `src/components/bills/BillsPage.tsx` — update to fetch/render groups with `PeriodHeader`
8. `src/components/balance/BalancePage.tsx` — same update

### Test Updates

**`src/db/bills.test.ts`** — add tests:
- `getBillTransactionsGroupedByPeriod` returns correct groups with `"May 15th – June 15th"` labels
- Period markers (`is_automatic=1, amount=0`) excluded from transaction lists
- Multiple periods create multiple groups
- No period markers → single group labeled "Transactions"
- Newest period appears first
- Transactions within group appear newest-first
- Period label computation for year-boundary (December → January)

**`src/db/balance.test.ts`** — identical tests.

**`e2e/bills.spec.ts`** — update existing journey tests:

*Current state (Iterations 1 & 2, journey-based pattern per `e2e-journey-transition.md`):*
```typescript
test.describe("money module journeys", () => {
    test.beforeEach(async ({page}) => {
        clearBills();
        setupBillsConfig(15);
    });

    test("Bills: Managing transactions", async ({page}) => {
        // 1. Land → 2. Add income → 3. Add expense → 4. Verify order (newest first)
        // Uses: data-testid="loader", page.waitForResponse() for POST sync
        // Verifies: transaction amounts visible, newest-first order via .divide-y locator
    });

    test("Bills: Configuration and persistence", async ({page}) => {
        // 1. Land → 2. Go to Admin → 3. Verify current value → 4. Update
        // → 5. Verify persistence after reload → 6. Return
        // Uses: data-testid="admin-button", data-testid="save-success", page.waitForResponse()
    });
});
```

*Updates for Iteration 3 (period grouping):*
- Update `"Bills: Managing transactions"` journey to verify period grouping:
  - After adding transactions, verify period headers visible: `page.getByTestId("period-header")`
  - Verify period label format: `await expect(page.getByTestId("period-header")).toContainText("May 15th – June 15th")`
  - Verify period-start markers NOT visible in transaction list (only user transactions show)
  - Update order verification: check transactions appear under correct period header
  - Verify newest period appears first (current period at top)
  - Change from `.divide-y.first()` (flat list) to period-scoped locators

**`e2e/balance.spec.ts`** — identical updates for `"Balance: Managing transactions"` and `"Balance: Configuration and persistence"` journeys.

*Note on E2E file naming:* Files renamed from `money-bills.spec.ts` / `money-balance.spec.ts` to `bills.spec.ts` / `balance.spec.ts` per journey-based transition. Both files use `test.describe("money module journeys", ...)` to group related journeys.

---

## Summary
Iteration 3 completes the Bills & Balance feature set: period grouping with descriptive `"May 15th – June 15th"` labels, using period-start markers inserted by the scheduler. The `PeriodHeader` component is shared across both modules. The flat list from Iterations 1 & 2 is replaced with grouped display. All DB infrastructure (tables, `is_automatic` column, seed data) was already put in place by earlier iterations. The seed migration bug (INSERT OR IGNORE without UNIQUE constraint) is fixed in this iteration.

## Full Feature Summary (All 3 Iterations)

| Feature | Iteration | Status |
|---|---|---|
| Transaction form (shared `TransactionForm.tsx`) | 1 | ✅ Done |
| Flat transaction list (shared `TransactionLine.tsx`) | 1 | ✅ Done |
| Separate DB tables (`bills_transactions`, `balance_transactions`) | 1 | ✅ Done |
| `is_automatic` column added | 2 | ✅ Done |
| Admin page (configure `day_of_month`) | 2 | ✅ Done |
| Scheduler (automatic period-start transactions) | 2 | ✅ Done |
| Seed data (May 15, 2026) | 2 | ✅ Done (bug fixed in 3) |
| `PeriodHeader` component | 3 | **Pending** |
| Period grouping with descriptive labels | 3 | **Pending** |
| `get*TransactionsGroupedByPeriod()` DB functions | 3 | **Pending** |
| Updated API returns `{ groups }` | 3 | **Pending** |
| Updated Pages render groups | 3 | **Pending** |
