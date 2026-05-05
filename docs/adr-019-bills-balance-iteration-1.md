# ADR-019: Bills & Balance Modules — Iteration 1 (Transaction Form + List)

## Status
Proposed (2026-05-05)

## Context
The Money module (`/money`) has three sub-nav items: Balance, Bills, and Allowance. Only Allowance is functional. Balance and Bills pages are placeholders ("Coming soon").

The full feature set (period grouping, admin page, period-start markers) will be delivered in Iteration 2 (ADR-020). This ADR covers **Iteration 1 only**:

1. **Add transaction form** — identical to Allowance's form (description + signed amount)
2. **Flat list of all transactions** — no period grouping, just a simple list sorted newest-first
3. **No admin page, no period grouping, no period-start automatic transactions**

We want to reuse the smallest possible components (bottom-up approach: `TransactionLine`, `TransactionForm`) while keeping Bills and Balance as separate tables and separate page components.

## Decision

### 1. Database Layer — Separate Tables, Minimal Schema

**Migration `013_bills.sql`:**
```sql
-- ADR-019 Iteration 1: Bills Module - Transaction Form + List
CREATE TABLE IF NOT EXISTS bills_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15
);
INSERT OR IGNORE INTO bills_config (id, day_of_month) VALUES (1, 15);

CREATE TABLE IF NOT EXISTS bills_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,       -- positive or negative, no type column
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

**Migration `014_balance.sql`** — identical structure with `balance_config` / `balance_transactions`.

**`src/db/bills.ts`** (separate file, not shared with balance.ts):

| Function | Purpose |
|---|---|
| `getBillsConfig(db?)` | Get config (creates default if missing) |
| `addBillTransaction(description, amount, db?)` | Add transaction (signed amount) |
| `getBillTransactions(db?)` | Return all transactions DESC (newest first), no grouping |

**`src/db/balance.ts`** — identical pattern.

No `is_automatic` column, no period grouping, no `checkAndAddPeriodStart` — those come in Iteration 2.

---

### 2. Shared UI Components (bottom-up, many small files)

All in `src/components/transactions/`:

| Component | Props | Renders |
|---|---|---|
| **TransactionLine.tsx** | `{ description, amount }` | Row: description (left) + signed colored amount (right, green if ≥0, red if <0) |
| **TransactionForm.tsx** | `{ description, amount, loading, onSubmit$ }` | Description input + amount input (placeholder "Amount (negative for expense)") + submit button |

**Not included in Iteration 1:** `PeriodHeader` (no period grouping yet).

---

### 3. Page Components

**`src/components/bills/BillsPage.tsx`:**
- Fetches `/api/bills/transactions` (flat list)
- Renders `TransactionForm` + flat list of `TransactionLine` components (newest first)
- No balance display, no title header (subnav shows location), no "Coming soon" text

**`src/components/bills/BillsAdmin.tsx`** — NOT in Iteration 1 (comes in Iteration 2).

**`src/components/balance/BalancePage.tsx`** — identical pattern.

---

### 4. API Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/bills/config` | GET | Return `{ day_of_month }` (needed for future Iteration 2, minimal here) |
| `/api/bills/transactions` | GET | Return `{ transactions: BillTransaction[] }` (flat, no groups) |
| `/api/bills/transactions` | POST | Accept `{ description, amount }`, add transaction |
| `/api/balance/*` | — | Same structure for Balance |

No DELETE endpoint. No admin POST endpoint (comes in Iteration 2).

---

### 5. Route Pages

- `src/routes/money/bills/index.tsx` — **modify**: remove `<h1>` + placeholder `<p>`, render `<BillsPage />`
- `src/routes/money/bills/admin/index.tsx` — NOT in Iteration 1
- `src/routes/money/balance/index.tsx` — **modify**: same as bills
- `src/routes/money/balance/admin/index.tsx` — NOT in Iteration 1

`MoneySubNav.tsx` — no changes needed.

---

### 6. Code Reuse — Extracted Utilities

**`src/utils/date.ts`** (new, extracted from `allowance.ts`):
```ts
export function getOrdinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}
```

**`src/db/allowance.ts`** — modify: remove local `getOrdinal()`, import from `src/utils/date.ts`.

---

## Consequences

### Positive
- **Small, focused delivery**: Form + list only, easy to test and validate
- **Many small files**: `TransactionLine.tsx`, `TransactionForm.tsx` — easy to reuse later
- **Separate tables**: Bills and Balance are independent, no shared schema coupling
- **Foundation for Iteration 2**: DB tables and shared components ready for period grouping
- **Consistent with Allowance**: Same form behavior, same amount coloring

### Negative
- **Duplicated DB patterns**: `bills.ts` and `balance.ts` are near-identical (acceptable for "best bang for the buck" approach)
- **No period grouping yet**: Transactions are a flat list (acceptable for Iteration 1)
- **No admin page yet**: Cannot configure `day_of_month` (comes in Iteration 2)

### Risks
- **Minimal risk**: Small scope, follows proven Allowance patterns throughout

## Implementation Notes — Files

### New Files (14)
1. `src/db/migrations/013_bills.sql`
2. `src/db/migrations/014_balance.sql`
3. `src/utils/date.ts`
4. `src/db/bills.ts`
5. `src/db/balance.ts`
6. `src/components/transactions/TransactionLine.tsx`
7. `src/components/transactions/TransactionForm.tsx`
8. `src/components/bills/BillsPage.tsx`
9. `src/components/balance/BalancePage.tsx`
10. `src/routes/api/bills/config/index.ts`
11. `src/routes/api/bills/transactions/index.ts`
12. `src/routes/api/balance/config/index.ts`
13. `src/routes/api/balance/transactions/index.ts`
14. `src/db/bills.test.ts`
15. `src/db/balance.test.ts`
16. `e2e/money-bills.spec.ts`
17. `e2e/money-balance.spec.ts`
18. `e2e/setup.ts` (modify: add Bills/Balance helpers)

### Modified Files (4)
1. `src/routes/money/bills/index.tsx` — remove `<h1>` + placeholder
2. `src/routes/money/balance/index.tsx` — remove `<h1>` + placeholder
3. `src/db/allowance.ts` — remove `getOrdinal`, import from `utils/date.ts`
4. `e2e/setup.ts` — add `clearBills()`, `setupBillsConfig()`, `addBillTransactionSql()`, + Balance helpers

## Tests

### DB Unit Tests (vitest)

**`src/db/bills.test.ts`:**
- `getBillsConfig` creates default (day_of_month=15) if missing
- `updateBillsConfig` updates `day_of_month` (prepare for Iteration 2)
- `addBillTransaction` inserts with correct signed amount
- `getBillTransactions` returns transactions DESC (newest first)

**`src/db/balance.test.ts`** — identical test suite for Balance.

### E2E Tests (Playwright)

**`e2e/money-bills.spec.ts`:**
- Navigate to `/money/bills` → form displayed, no "Coming soon" text, no `<h1>`
- Add income (positive amount) → appears in list with green **+100**
- Add expense (negative amount) → appears in list with red **50**
- Newest transaction appears at top of list
- Verify `AdminButton` NOT present (no admin page yet)

**`e2e/money-balance.spec.ts`** — identical suite for Balance.

## Summary
Iteration 1 delivers the foundation: transaction form + flat transaction list for both Bills and Balance. Shared UI components (`TransactionLine`, `TransactionForm`) are extracted for reuse. Separate DB tables keep things independent. Iteration 2 will add period grouping, admin pages, and period-start automatic transactions.
