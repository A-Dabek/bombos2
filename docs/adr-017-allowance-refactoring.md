# ADR-017: Refactor Allowance Module for Simplicity

## Status
Proposed (2026-05-01)

## Context
The Allowance module (ADR-016) is fully functional but contains unnecessary complexity:
- Unused functions (`getAllowanceTransactions`) and fields (`updated_at`)
- Verbose database patterns (`.raw(true)` with manual array-to-object mapping adds ~50 lines)
- Redundant calculations (recalculating ALL balances when deleting last transaction)
- Fragile UI logic (computing `lastTransactionId` by iterating groups)

The goal is to simplify the code while preserving all functionality. Less code = easier maintenance, as long as readability is maintained.

## Decision

### 1. Database Layer Simplification (`src/db/allowance.ts`)

**Remove unused function:**
- Delete `getAllowanceTransactions()` (lines 136-152) - not used in production, only in tests

**Remove unused field:**
- Create migration `012_drop_allowance_config_updated_at.sql` to drop `updated_at` column from `allowance_config`
- Remove `updated_at` from `AllowanceConfig` interface
- Remove `updated_at` from `getAllowanceConfig()` queries and mappings

**Simplify database query patterns:**
- Remove all `.raw(true)` calls - better-sqlite3 returns objects by default
- This eliminates ~50 lines of manual mapping code across 6 functions:
  - `getAllowanceConfig()`
  - `getCurrentBalance()`
  - `getTransactionsGroupedByPeriod()`
  - `getAllowanceTransactions()` (being deleted)
  - `addAllowanceTransaction()` (no mapping, but uses raw in getCurrentBalance call)
  - `deleteLastTransaction()`
  - `checkAndAddAllowance()` (uses raw in existing check)

**Simplify `deleteLastTransaction()`:**
- Remove the balance recalculation loop (lines 191-203)
- After deleting last transaction, simply return balance from the new last transaction (or 0 if empty)
- Changes O(n) operation to O(1)

**Estimated reduction: ~85 lines**

### 2. API Route Updates

**GET `/api/allowance/transactions`:**
- Add `lastTransactionId` to response for UI simplification
- Query: `SELECT id FROM allowance_transactions ORDER BY id DESC LIMIT 1`
- Response: `{ groups, balance, lastTransactionId }`

**POST `/api/allowance/transactions`:**
- Simplify type detection (line 18) - remove overly complex fallback chain
- Current: `const type = (body as any)?.type as "allowance" | "expense" | "income" || (amount > 0 ? "income" : "expense");`
- Simplified: Determine type from amount sign if not provided

**DELETE `/api/allowance/transactions/[id]`:**
- No changes needed (already simple)

**Estimated reduction: ~10 lines**

### 3. Component Simplification

**`AllowancePage.tsx`:**
- Remove `getLastTransactionId()` function (lines 85-92)
- Use `lastTransactionId` from API response instead
- Simplify delete button conditional: `tx.id === lastTransactionId`

**`AllowanceAdmin.tsx`:**
- Change `onInput$` handlers to `bind:value` for consistency with `AllowancePage.tsx`
- Change `dayOfMonth` and `monthlyAmount` signal initialization to use `config.value?.day_of_month.toString()` pattern

**Estimated reduction: ~20 lines**

### 4. Test Cleanup (`src/db/allowance.test.ts`)

**Remove tests for deleted function:**
- Delete: `getAllowanceTransactions returns in DESC order` test (lines 96-111)

**Update tests for changed behavior:**
- `deleteLastTransaction` tests: Update expectations since no recalculation occurs (behavior is same, but test can be clearer)
- `getAllowanceConfig` tests: Remove `updated_at` assertions

**Consolidate redundant tests:**
- Merge `getAllowanceConfig creates default config if not exists` and `getAllowanceConfig returns existing config` into a single comprehensive test
- This eliminates duplicate `resetDb()` / `openDb()` / `close()` boilerplate

**Estimated reduction: ~50 lines**

### 5. Migration

**New migration `012_drop_allowance_config_updated_at.sql`:**
```sql
-- Drop updated_at column from allowance_config
-- ADR-017: Remove unused field

CREATE TABLE allowance_config_new (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15,
  monthly_amount INTEGER NOT NULL DEFAULT 600
);

INSERT INTO allowance_config_new (id, day_of_month, monthly_amount)
SELECT id, day_of_month, monthly_amount FROM allowance_config;

DROP TABLE allowance_config;
ALTER TABLE allowance_config_new RENAME TO allowance_config;

INSERT OR IGNORE INTO allowance_config (id, day_of_month, monthly_amount) VALUES (1, 15, 600);
```

## Consequences

### Positive
- **~165 lines removed** across 6 files
- **Simpler database patterns**: No more `.raw(true)` and manual mapping
- **O(1) delete operation**: No more balance recalculation loop
- **Cleaner API response**: `lastTransactionId` simplifies UI logic
- **Less boilerplate in tests**: Consolidated setup/teardown
- **Maintainable**: Each function does one thing clearly

### Negative
- **Breaking API change**: Adding `lastTransactionId` to GET response (acceptable - personal app)
- **Migration required**: Schema change for `allowance_config` table
- **Delete behavior change**: Now O(1) instead of recalculating (same result, faster)

### Risks
- **Migration on SQLite**: Column drop requires table rebuild (handled correctly in migration)
- **Test coverage**: Removing tests reduces coverage count (but removes testing of deleted code)

## Implementation Notes

### Files to Modify
1. **Migration**: `src/db/migrations/012_drop_allowance_config_updated_at.sql` (new file)
2. **DB layer**: `src/db/allowance.ts` (~254 lines → ~170 lines)
3. **API routes**:
   - `src/routes/api/allowance/transactions/index.ts` (~31 lines → ~25 lines)
   - `src/routes/api/allowance/transactions/[id]/index.ts` (no change)
   - `src/routes/api/allowance/config/index.ts` (no change)
4. **Components**:
   - `src/components/allowance/AllowancePage.tsx` (~180 lines → ~165 lines)
   - `src/components/allowance/AllowanceAdmin.tsx` (~110 lines → ~100 lines)
5. **Tests**: `src/db/allowance.test.ts` (~240 lines → ~190 lines)
6. **E2E tests**: `e2e/money-allowance.spec.ts` - minor update for API response change

### Test Plan
**DB tests (updated):**
- 14 tests (down from 16) - removed 1, consolidated 2
- All tests pass after refactoring

**E2E tests (minor updates):**
- Update `money-allowance.spec.ts` if `lastTransactionId` requires new test assertions
- All 10 E2E tests should still pass

**Commands to verify:**
```bash
pnpm build.types  # TypeScript check
pnpm test.db      # Run DB unit tests
pnpm e2e          # Run E2E tests
pnpm build        # Production build
```

## Summary
This refactoring removes ~165 lines of unnecessary code while preserving all functionality. Key wins:
- Removed unused function and field
- Simplified DB patterns (removed `.raw(true)` usage)
- Faster delete operation (O(1) instead of O(n))
- Cleaner component logic (using API-provided `lastTransactionId`)
- Consolidated test boilerplate

All changes follow existing project patterns and maintain backward compatibility with the personal use case (breaking API changes acceptable).
