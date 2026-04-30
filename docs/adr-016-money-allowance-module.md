# ADR-016: Money Module - Allowance Sub-Module

## Status
Accepted (Implemented 2026-04-30)

## Context
The Money module needs its first functional sub-module: Allowance. This tracks monthly allowance income and expenses as a simple account balance with transaction history. The user wants to see their current balance, monthly income setting, and a transaction list grouped by allowance periods.

Key requirements:
- Three sub-nav items under Money: Balance, Bills, Allowance (only Allowance is functional initially)
- Allowance page shows current balance, monthly income, and transaction history
- Transactions grouped by allowance periods (determined by monthly allowance addition date)
- Simple form to add income (positive amount) or expenses (negative amount)
- Admin page to configure the day of month for allowance and the monthly amount
- Nightly cron job to automatically add allowance on the configured day

## Decision
Implement the Allowance sub-module with:

### Database Schema
- `allowance_config` table (single-row): stores `day_of_month` (default 15) and `monthly_amount` (default 600)
- `allowance_transactions` table: stores all transactions with type ('allowance', 'expense', 'income'), description, amount, running balance_after, and created_at

### Architecture Patterns
- Follow existing project patterns: optional `db` parameter for test injection, Qwik City API routes (`onGet`/`onPost`), `useVisibleTask$` for client-side data fetching
- Group transactions by allowance periods: each 'allowance' type transaction starts a new period group
- Store `balance_after` on each transaction (not computed on read) for performance
- Only allow deletion of the last transaction (highest id) to maintain balance integrity

### Transaction Form
- Simplified UI: description input + amount input (no radio buttons)
- Amount sign determines type: positive = 'income', negative = 'expense'
- This keeps the UI compact as requested

### Scheduler
- Extend existing `src/server/scheduler.ts` with allowance check in the daily 04:00 cron
- Check if today matches `day_of_month` config, then verify no allowance transaction exists for current month (using YYYY-MM format)
- This prevents double-adding if config changes or cron runs multiple times

### Sub-Navigation
- Create `MoneySubNav` component following `MealSubNav` pattern
- Money layout wraps child routes with sub-nav
- Balance and Bills pages are placeholders for now

## Consequences

### Positive
- Clear transaction history with running balance
- Simple, compact UI for adding transactions
- Automated monthly allowance addition
- Configurable allowance day and amount
- Follows established project patterns (testing, DB access, API routes)

### Negative
- Only last transaction can be deleted (by design, to preserve balance integrity)
- No pagination (full list shown) - may need pagination if transactions grow large
- Balance and Bills sub-pages are empty placeholders

### Risks
- If scheduler fails or cron doesn't run, allowance won't be added automatically
- Timezone considerations: `day_of_month` check uses server's local date, not UTC

## Implementation Notes
- Migration: `010_allowance.sql`
- DB layer: `src/db/allowance.ts` (9 functions: getAllowanceConfig, getCurrentBalance, getTransactionsGroupedByPeriod, getAllowanceTransactions, addAllowanceTransaction, deleteLastTransaction, updateAllowanceConfig, checkAndAddAllowance)
- API routes: `/api/allowance/config` (GET/POST), `/api/allowance/transactions` (GET/DELETE)
- Pages: `/money/layout.tsx`, `/money/allowance/index.tsx`, `/money/allowance/admin/index.tsx`
- Components: `MoneySubNav`, `AllowancePage`, `AllowanceAdmin`, shared `SubNav` component
- Tests: `src/db/allowance.test.ts` (16 unit tests), `e2e/money-allowance.spec.ts` (10 e2e tests), `e2e/money-nav.spec.ts` (7 e2e tests)
- Scheduler: Integrated into `src/server/scheduler.ts` daily 04:00 cron job
- All 45 DB tests pass, all 59 e2e tests pass
