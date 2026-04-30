# Task Breakdown: ADR-016 Money Allowance Module (Incremental)

Each task delivers a complete, e2e-testable feature slice. Tasks build left-to-right (user-visible functionality first), not bottom-up.

---

## Task 1: Navigation + Money Layout + Placeholder Pages
**What**: Add Money to top nav, create layout with sub-nav, placeholder pages for all 3 tabs.

**Files**:
- `src/components/TopNav.tsx` (modify) - add Money link with icon
- `src/routes/money/layout.tsx` (new) - MoneySubNav + Slot
- `src/routes/money/index.tsx` (new) - redirect to /money/allowance
- `src/routes/money/balance/index.tsx` (new) - placeholder
- `src/routes/money/bills/index.tsx` (new) - placeholder
- `src/routes/money/allowance/index.tsx` (new) - placeholder "Allowance coming soon"
- `src/components/money/MoneySubNav.tsx` (new) - Balance | Bills | Allowance tabs

**E2E Test**: Navigate to /money, verify sub-nav shows 3 tabs, Allowance tab active, placeholder text visible.

**Acceptance**: 
- Money appears in top nav
- Clicking Money goes to /money/allowance
- Sub-nav shows Balance, Bills, Allowance
- All 3 tabs render (placeholders)

**Dependencies**: None

---

## Task 2: Allowance Page - Balance Display + Monthly Income
**What**: Show current balance and monthly income config on Allowance page. Requires DB migration, config API, and page component together.

**Files**:
- `src/db/migrations/010_allowance.sql` (new) - allowance_config + allowance_transactions tables
- `src/db/allowance.ts` (new) - `getAllowanceConfig()`, `getCurrentBalance()`
- `src/routes/api/allowance/config/index.ts` (new) - GET returns config
- `src/components/allowance/AllowancePage.tsx` (new) - balance display + monthly income display + admin button
- `src/routes/money/allowance/index.tsx` (modify) - render AllowancePage

**E2E Test**: Navigate to /money/allowance, verify balance shows "0" (green), monthly income shows "600" with "monthly: +600", admin button visible.

**Acceptance**:
- Page shows current balance (formatted, colored)
- Page shows monthly income from config (600 default)
- Admin button links to /money/allowance/admin
- DB migration creates tables
- API returns config

**Dependencies**: Task 1

---

## Task 3: Add Transaction Form + POST API
**What**: Compact form to add income/expense transactions. Requires API POST + form component.

**Files**:
- `src/db/allowance.ts` (modify) - add `addAllowanceTransaction(type, description, amount)`
- `src/routes/api/allowance/transactions/index.ts` (new) - GET (list) + POST (add)
- `src/components/allowance/AllowancePage.tsx` (modify) - add form below balance

**Form Behavior**:
- Description input (text)
- Amount input (number, placeholder "Amount (negative for expense)")
- "Add" button
- Positive amount → type='income', Negative amount → type='expense'

**E2E Test**: On /money/allowance, fill description "Test", amount "100", click Add. Verify transaction appears in list with "+100" and balance updates.

**Acceptance**:
- Form adds income (positive amount)
- Form adds expense (negative amount, stored as positive with type='expense')
- Balance updates after adding
- API POST creates transaction with correct type

**Dependencies**: Task 2

---

## Task 4: Transaction List with Period Grouping
**What**: Display transactions grouped by allowance periods with proper layout.

**Files**:
- `src/db/allowance.ts` (modify) - add `getTransactionsGroupedByPeriod()`
- `src/routes/api/allowance/transactions/index.ts` (modify) - GET returns groups
- `src/components/allowance/AllowancePage.tsx` (modify) - render transaction groups

**Layout**:
- Headers: "February 15th --------" format
- Rows: `Description (left) | Amount (right-aligned) | (Balance) (right-aligned)`
- Amount colored: green for income/allowance, red for expense

**E2E Test**: Add multiple transactions, verify they appear grouped under "Transactions" header (no allowance transaction yet). Verify columns align correctly.

**Acceptance**:
- Transactions listed with correct layout
- Description left, Amount right, Balance in parens right
- Grouped by allowance periods (or "Transactions" if none)
- Amounts and balances are right-aligned

**Dependencies**: Task 3

---

## Task 5: Delete Last Transaction
**What**: Allow deleting only the last transaction (highest id).

**Files**:
- `src/db/allowance.ts` (modify) - add `deleteLastTransaction()`
- `src/routes/api/allowance/transactions/[id]/index.ts` (new) - DELETE, checks if id is highest
- `src/components/allowance/AllowancePage.tsx` (modify) - show delete (X) button only on last transaction

**E2E Test**: Add 2 transactions. Verify only last shows delete button. Click delete. Verify transaction removed, balance recalculated, delete button now on new last transaction.

**Acceptance**:
- Only last transaction (highest id) shows delete button
- DELETE API returns error if not last transaction
- After delete, balances recalculate correctly
- Delete button appears on new last transaction

**Dependencies**: Task 4

---

## Task 6: Admin Page - Configure Allowance
**What**: Admin page to update day_of_month and monthly_amount.

**Files**:
- `src/db/allowance.ts` (modify) - add `updateAllowanceConfig()`
- `src/routes/api/allowance/config/index.ts` (modify) - add POST to update
- `src/components/allowance/AllowanceAdmin.tsx` (new) - form with day/month inputs
- `src/routes/money/allowance/admin/index.tsx` (new) - render AllowanceAdmin

**E2E Test**: Click admin button on allowance page. Change day to 20, amount to 800. Save. Navigate back to allowance page. Verify monthly income shows "800" with "monthly: +800".

**Acceptance**:
- Admin page loads current config values
- Can update day_of_month (1-28) and monthly_amount
- Changes reflect on main allowance page
- API POST updates config

**Dependencies**: Task 2

---

## Task 7: Scheduler - Auto-Add Allowance
**What**: Nightly cron checks if allowance should be added on configured day.

**Files**:
- `src/db/allowance.ts` (modify) - ensure `addAllowanceTransaction()` handles 'allowance' type
- `src/server/scheduler.ts` (modify) - add allowance check to daily 04:00 cron

**Scheduler Logic**:
- Get config via `getAllowanceConfig()`
- If today.getDate() === config.day_of_month:
  - Check if allowance transaction exists for current month (YYYY-MM format)
  - If not, add allowance transaction

**E2E Test**: This is hard to e2e test directly. Instead, verify via:
- Manual test: change day_of_month to today, wait for 04:00 or manually trigger
- Or add a test API endpoint to trigger scheduler manually (optional)

**Acceptance**:
- Scheduler runs without errors
- Allowance added on configured day (once per month)
- No duplicate allowances for same month

**Dependencies**: Task 2, Task 6

---

## Task 8: DB Unit Tests
**What**: Vitest tests for all DB functions.

**Files**:
- `src/db/allowance.test.ts` (new)

**Tests**:
- Config returns defaults (15, 600)
- Update config works
- Add transaction calculates balance_after
- Delete only last transaction
- Grouping by periods works
- getCurrentBalance accuracy

**Acceptance**: `pnpm test.db` passes with all allowance tests.

**Dependencies**: All previous tasks (or can be done alongside)

---

## Task 9: Build Verification + Final E2E Tests
**What**: Ensure everything works together.

**Files**: Potentially new E2E tests

**Checks**:
- `pnpm build` passes
- `pnpm build.types` passes
- `pnpm test.db` passes (all DB tests)
- E2E: Full flow (navigate → add transactions → delete → admin config → verify auto-grouping)

**Acceptance**: All checks pass.

**Dependencies**: All previous tasks

---

## Summary - Incremental Flow

| Task | Feature Delivered | E2E Testable |
|------|-------------------|--------------|
| 1 | Nav + Layout + Placeholders | ✅ Nav + tabs work |
| 2 | Balance + Monthly Income Display | ✅ Numbers show correctly |
| 3 | Add Transaction Form | ✅ Can add income/expense |
| 4 | Transaction List + Grouping | ✅ List renders with layout |
| 5 | Delete Last Transaction | ✅ Delete works, only last |
| 6 | Admin Config Page | ✅ Can update settings |
| 7 | Scheduler Auto-Add | ⚠️ Manual/integration test |
| 8 | DB Unit Tests | ✅ `pnpm test.db` |
| 9 | Build + Final Verification | ✅ Full E2E flow |

**Recommended Order**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Each task delivers a complete, visible feature that can be tested end-to-end.
