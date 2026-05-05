# ADR-020: Bills & Balance Modules — Iteration 2 (Admin Page + Scheduler)

## Status
Proposed (2026-05-05)

## Context
ADR-019 (Iteration 1) delivered the foundation for Bills and Balance modules:
- Transaction form (`TransactionForm.tsx`) — shared component
- Flat transaction list using `TransactionLine.tsx` — shared component
- Separate DB tables (`bills_transactions`, `balance_transactions`)
- Separate DB files (`bills.ts`, `balance.ts`)
- API routes for GET/POST transactions and GET config

**Iteration 2 adds:**
1. **Admin page** for each module — configure `day_of_month` (period start day)
2. **Scheduler** — automatically insert period-start transactions (`amount=0`, `is_automatic=true`) on the configured `day_of_month` each month
3. **`is_automatic` column** — added to transaction tables to distinguish period markers from user transactions

**Not in this iteration:** Period grouping (display). Period-start transactions are inserted and stored, but the UI still shows a flat list. Grouping comes in Iteration 3 (ADR-021).

## Decision

### 1. Database Changes — Add `is_automatic` Column

**Migration `015_add_is_automatic_bills.sql`:**
```sql
-- ADR-020 Iteration 2: Add is_automatic column to bills_transactions
ALTER TABLE bills_transactions ADD COLUMN is_automatic INTEGER NOT NULL DEFAULT 0;

-- Seed initial period marker: May 15, 2026 (start of known period)
INSERT OR IGNORE INTO bills_transactions (description, amount, is_automatic, created_at)
VALUES ('Period start', 0, 1, strftime('%s', '2026-05-15'));
```

**Migration `016_add_is_automatic_balance.sql`:**
```sql
-- ADR-020 Iteration 2: Add is_automatic column to balance_transactions
ALTER TABLE balance_transactions ADD COLUMN is_automatic INTEGER NOT NULL DEFAULT 0;

-- Seed initial period marker: May 15, 2026
INSERT OR IGNORE INTO balance_transactions (description, amount, is_automatic, created_at)
VALUES ('Period start', 0, 1, strftime('%s', '2026-05-15'));
```

**Why `amount=0` for period markers?**
- Period-start transactions serve only as grouping anchors (like Allowance's automatic allowance transactions)
- `amount=0` means they don't affect any balance calculation
- UI will filter them out in Iteration 3 when grouping is implemented

---

### 2. Update DB Layer (`src/db/bills.ts` and `src/db/balance.ts`)

Add to **both** `bills.ts` and `balance.ts`:

| New Function | Purpose |
|---|---|
| `addPeriodStartTransaction(db?)` | Insert `is_automatic=1, amount=0` with current timestamp |
| `checkAndAddPeriodStart(db?)` | Scheduler helper: if today = `day_of_month` and no marker exists for current period, insert one |

Update existing functions:
- `addBillTransaction()` → add optional `is_automatic` parameter (default `false`)
- `getBillTransactions()` → optionally filter out `is_automatic=1` (for flat list in Iteration 2; Iteration 3 will use them for grouping)

Updated `BillsTransaction` interface:
```ts
export interface BillsTransaction {
  id: number;
  description: string;
  amount: number;
  is_automatic: boolean;
  created_at: number;
}
```

---

### 3. API Routes — Add Config POST + Update Transactions POST

**`/api/bills/config` — add POST:**
```ts
export const onPost: RequestHandler = async ({ json, error, parseBody }) => {
  const body = await parseBody();
  const day_of_month = Number((body as any).day_of_month);
  
  if (isNaN(day_of_month) || day_of_month < 1 || day_of_month > 28) {
    throw error(400, "day_of_month must be between 1 and 28");
  }
  
  const config = updateBillsConfig(day_of_month);
  json(200, config);
};
```

**`/api/bills/transactions` — update POST** to pass `is_automatic=false` explicitly.

Same changes for `/api/balance/*`.

---

### 4. Admin Page Components

**`src/components/bills/BillsAdmin.tsx`** (new):
- Fetches `/api/bills/config` on load, populates `day_of_month` input
- `day_of_month` input: type="number", min=1, max=28
- Save button → POST to `/api/bills/config`
- Success message on save (`data-testid="save-success"`)
- Uses `BackButton href="/money/bills"`
- **No** `monthly_amount` field (unlike Allowance)

**`src/components/balance/BalanceAdmin.tsx`** (new) — identical pattern.

---

### 5. Route Pages for Admin

**`src/routes/money/bills/admin/index.tsx`** (new):
```tsx
import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import BillsAdmin from "~/components/bills/BillsAdmin";

export default component$(() => <BillsAdmin />);

export const head: DocumentHead = {
  title: "Bills Admin - Money",
};
```

**`src/routes/money/balance/admin/index.tsx`** (new) — identical pattern.

---

### 6. Scheduler Updates (`src/server/scheduler.ts`)

Add to the daily 04:00 cron:

```ts
import { checkAndAddBillsPeriodStart } from "../db/bills";
import { checkAndAddBalancePeriodStart } from "../db/balance";

function runPeriodStartChecks(): void {
  log("period-start", "Checking if period-start transactions should be added");
  
  try {
    const billsResult = checkAndAddBillsPeriodStart();
    if (billsResult.added) {
      log("period-start", `Added Bills period-start.`);
    }
  } catch (err) {
    log("error", `Failed to check/add Bills period-start: ${err}`);
  }
  
  try {
    const balanceResult = checkAndAddBalancePeriodStart();
    if (balanceResult.added) {
      log("period-start", `Added Balance period-start.`);
    }
  } catch (err) {
    log("error", `Failed to check/add Balance period-start: ${err}`);
  }
}

export function startScheduler(): void {
  // ... existing code ...
  cron.schedule("0 4 * * *", () => {
    runCleanup();
    runAllowanceCheck();
    runPeriodStartChecks();  // NEW
  });
}
```

**`checkAndAddBillsPeriodStart()` logic:**
1. Get `day_of_month` from config
2. Check if `today.getDate() === day_of_month`
3. If yes, check if a period-start marker already exists for current period:
   - Current period start = `YYYY-MM-day_of_month`
   - Next period start = next month's `day_of_month`
   - Query: `SELECT id FROM bills_transactions WHERE is_automatic=1 AND created_at >= ? AND created_at < ?`
4. If no marker exists, insert one with `amount=0`, `is_automatic=1`, `description='Period start'`

---

### 7. Update Existing Pages (Iteration 1 Code)

**`BillsPage.tsx` and `BalancePage.tsx`:**
- Add `AdminButton href="/money/bills/admin"` (or `/money/balance/admin`)
- Filter out `is_automatic` transactions from the flat list (they shouldn't appear in the UI yet)

**`BillsTransaction` / `BalanceTransaction` interface** already updated in DB layer; update the import in page components.

---

## Consequences

### Positive
- **Admin control**: User can configure period start day for each module independently
- **Automatic period markers**: Scheduler ensures period-start transactions are inserted reliably
- **Foundation for grouping**: Period markers are in place; Iteration 3 just needs to group by them
- **Consistent with Allowance**: Same scheduler pattern, same `is_automatic` concept
- **Minimal UI change**: Flat list still shown; `AdminButton` is the only visible change

### Negative
- **Still no period grouping in UI**: Transactions still appear as a flat list (acceptable — Iteration 3)
- **`is_automatic` transactions appear in list**: Need to filter them out in Iteration 2 page code until grouping arrives
- **Duplicated scheduler logic**: `checkAndAddBillsPeriodStart` and `checkAndAddBalancePeriodStart` are near-identical (acceptable for "best bang for the buck")

### Risks
- **Migration on SQLite**: `ALTER TABLE ADD COLUMN` is straightforward in SQLite (low risk)
- **Scheduler timing**: If server is down at 04:00, period marker won't be inserted that day (acceptable — user can manually trigger via admin or wait until next month)
- **Seed data**: May 15, 2026 seed transaction ensures there's at least one period marker for testing

## Implementation Notes — Files

### New Files (8)
1. `src/db/migrations/015_add_is_automatic_bills.sql`
2. `src/db/migrations/016_add_is_automatic_balance.sql`
3. `src/components/bills/BillsAdmin.tsx`
4. `src/components/balance/BalanceAdmin.tsx`
5. `src/routes/money/bills/admin/index.tsx`
6. `src/routes/money/balance/admin/index.tsx`
7. `e2e/money-bills-admin.spec.ts` (new E2E tests)
8. `e2e/money-balance-admin.spec.ts` (new E2E tests)

### Modified Files (7)
1. `src/db/bills.ts` — add `is_automatic` column support, `addPeriodStartTransaction()`, `checkAndAddPeriodStart()`
2. `src/db/balance.ts` — same changes
3. `src/routes/api/bills/config/index.ts` — add POST handler
4. `src/routes/api/bills/transactions/index.ts` — update POST to handle `is_automatic`
5. `src/routes/api/balance/config/index.ts` — add POST handler
6. `src/routes/api/balance/transactions/index.ts` — update POST
7. `src/server/scheduler.ts` — add `runPeriodStartChecks()`
8. `src/components/bills/BillsPage.tsx` — add `AdminButton`, filter `is_automatic`
9. `src/components/balance/BalancePage.tsx` — same changes
10. `e2e/setup.ts` — update `addBillTransactionSql()` and `addBalanceTransactionSql()` to accept `is_automatic` and `created_at`

## Tests

### DB Unit Tests (vitest) — Update Existing

**`src/db/bills.test.ts`** — add tests:
- `addBillTransaction` with `is_automatic=true` inserts correctly
- `checkAndAddPeriodStart` inserts marker on correct day
- `checkAndAddPeriodStart` does not duplicate within same period
- `getBillTransactions` can filter out `is_automatic` transactions
- Seed data (May 15, 2026) exists after migration

**`src/db/balance.test.ts`** — identical tests.

### E2E Tests (Playwright)

**`e2e/money-bills.spec.ts`** — update existing:
- Verify `AdminButton` visible on `/money/bills`
- Click `AdminButton` → navigates to `/money/bills/admin`

**`e2e/money-bills-admin.spec.ts`** (new):
- Navigate to `/money/bills/admin`
- Verify `day_of_month` input shows current value (15)
- Change day to 20, click Save
- Verify success message (`data-testid="save-success"`)
- Navigate back to `/money/bills`, verify admin button still works

**`e2e/money-balance.spec.ts`** — same updates as Bills
**`e2e/money-balance-admin.spec.ts`** (new) — same as Bills

## Summary
Iteration 2 adds the admin page and automatic period-start transactions. The building blocks from Iteration 1 (shared `TransactionForm`, `TransactionLine`, separate DB tables) are reused. Period-start markers are inserted by the scheduler and stored in the DB with `is_automatic=1, amount=0`. The UI still shows a flat list (with `is_automatic` transactions filtered out). **Iteration 3 (ADR-021)** will implement period grouping using these markers.
