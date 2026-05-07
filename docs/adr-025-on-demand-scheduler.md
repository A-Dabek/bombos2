# ADR-025: On-Demand Scheduler Functions

## Status
Draft

## Problem
Scheduler runs daily at 04:00 UTC performing cleanup, allowance checks, and period-start checks. Users cannot trigger these functions on demand. Needed for:
- Emergency runs if scheduler fails
- Verify correctness after config changes
- Run outside scheduled time (e.g., changed period start to 14th but it's 16th, don't want to wait a month)

**Critical Issue Discovered**: Current DB functions (`checkAndAddAllowance`, `checkAndAddBillsPeriodStart`, `checkAndAddBalancePeriodStart`) check `today.getDate() === config.day_of_month` and return early if not matching. This means **on-demand buttons won't work for past dates**. Fix required: add `force?: boolean` parameter to skip date check when called on-demand.

## Proposed Solution

### 1. Split DB functions into `check` + `run` methods

**Key insight**: Separate "should I run?" logic from "do the work" logic.

**New architecture**:
- **`checkX()`** — Scheduler only. Checks `today === day_of_month`. Returns boolean.
- **`runX(db?)`** — Scheduler + On-demand. Checks "already processed?" to prevent duplicates. Inserts with **configured date** (not today).

**Scheduler flow**: `if (checkAllowance()) runAllowance()`

**On-demand flow**: Just call `runAllowance()` directly (skips date check, uses configured date).

#### Functions to create:

| Old Function | New Check Method | New Run Method |
|--------------|------------------|----------------|
| `checkAndAddAllowance()` | `shouldAddAllowance(db?)` → boolean | `runAllowance(db?)` — inserts with configured date |
| `checkAndAddBillsPeriodStart()` | `shouldAddBillsPeriodStart(db?)` → boolean | `runBillsPeriodStart(db?)` — adds period marker with configured date |
| `checkAndAddBalancePeriodStart()` | `shouldAddBalancePeriodStart(db?)` → boolean | `runBalancePeriodStart(db?)` — adds period marker with configured date |

**`run` methods contain**:
1. Calculate target date (most recent `day_of_month` that passed)
2. Check "already processed for target's period?"
3. If not processed → insert with `created_at = target date`

**`createAutomaticPaymentTransactions(db?)`** — no change needed (no date logic)

**Delete old functions**: `checkAndAddAllowance`, `checkAndAddBillsPeriodStart`, `checkAndAddBalancePeriodStart` replaced by check/run pairs.

### 2. Update scheduler.ts
Split `runAllowanceCheck()` into check + run:
- `shouldAddAllowance()` — check `today === day_of_month`
- `runAllowance()` — call DB's `runAllowance()`

Same for period-start checks:
- `shouldAddBillsPeriodStart()` + `runBillsPeriodStart()`
- `shouldAddBalancePeriodStart()` + `runBalancePeriodStart()`

**Scheduler flow**:
```
if (shouldAddAllowance()) runAllowance()
if (shouldAddBillsPeriodStart()) runBillsPeriodStart()
if (shouldAddBalancePeriodStart()) runBalancePeriodStart()
```

Export `runCleanup`, `runAllowance`, `runBillsPeriodStart`, `runBalancePeriodStart` for API use.

### 3. Create API endpoints (one per submodule)
Create POST endpoints that call `run` methods directly (no date check):

| Endpoint | Calls | Module |
|----------|-------|--------|
| `POST /api/parcels/admin/run-cleanup` | `deleteCompletedParcels()` | Parcels |
| `POST /api/allowance/admin/run-check` | `runAllowance()` | Allowance |
| `POST /api/bills/admin/run-period-start` | `runBillsPeriodStart()` + `createAutomaticPaymentTransactions()` | Bills |
| `POST /api/balance/admin/run-period-start` | `runBalancePeriodStart()` | Balance |

Endpoints return JSON: `{ "success": true, "result": { "added": true, "newBalance": 1000 } }`

### 4. Create admin pages and add buttons
- **Create** `/parcels/admin` page with "Run Cleanup" button
- **Add** "Run Allowance Check" button to allowance admin (`/money/allowance/admin`)
- **Add** "Run Period Start Check" button to bills admin (`/money/bills/admin`)
- **Add** "Run Period Start Check" button to balance admin (`/money/balance/admin`)

Each button only invokes its own module's function (per user decision to split).

### 5. Button behavior
- Use existing `DoubleConfirmButton` component (prevents accidental clicks)
- Show loading state during API call
- Show success/error message after (e.g., "Cleanup complete. Deleted 5 parcels.")
- Success message uses returned result data

## Acceptance Criteria
1. API endpoints exist and return correct JSON
2. Buttons present in all four admin pages (parcels, allowance, bills, balance)
3. Buttons trigger correct API endpoint
4. Loading state shown during API call
5. Success/error message displayed after
6. Same DB functions called as scheduler (verified)

## Tests

### E2E Tests (Playwright)
Location: `e2e/admin-on-demand.spec.ts`

**Key point**: No force flag needed. Functions calculate target date automatically (e.g., set config `day_of_month=14`, today=16th → processes 14th).

1. **Cleanup button**:
   - Navigate to `/parcels/admin`
   - Add completed parcels via API
   - Click "Run Cleanup" button
   - Verify completed parcels deleted

2. **Allowance check button**:
   - Navigate to `/money/allowance/admin`
   - Set allowance config `day_of_month` to 14 via API
   - Click "Run Allowance Check"
   - Verify allowance transaction added with `created_at = 14th`

3. **Bills period-start button**:
   - Navigate to `/money/bills/admin`
   - Set bills config `day_of_month` to 14 via API
   - Click "Run Period Start Check"
   - Verify period marker added for 14th
   - Verify automatic payment transactions created

4. **Balance period-start button**:
   - Navigate to `/money/balance/admin`
   - Set balance config `day_of_month` to 14 via API
   - Click "Run Period Start Check"
   - Verify period marker added for 14th

### Integration Tests (vitest)
Location: `src/db/allowance.test.ts`, `src/db/bills.test.ts`, `src/db/balance.test.ts` (extend existing)

**Test `runAllowance()`**:
1. **First call adds** (set config `day_of_month=14`, today=16th):
   - Call `runAllowance()`
   - Verify allowance transaction added with `created_at = 14th`

2. **Second call skips** (already processed):
   - Call `runAllowance()` again
   - Verify NO new transaction added

**Test `shouldAddAllowance()`** (scheduler check):
3. **Returns true when today = day_of_month**:
   - Mock today=15th, config=15th → returns true

4. **Returns false when today ≠ day_of_month**:
   - Mock today=16th, config=15th → returns false

**Test `runBillsPeriodStart()`**:
5. **First call adds period marker**:
   - Config `day_of_month=14`, today=16th
   - Call `runBillsPeriodStart()`
   - Verify period marker added for 14th

6. **Second call skips**:
   - Call again → verify NO new marker

**Test `runBalancePeriodStart()`** — same pattern as bills

## Resolved Decisions
1. ✓ Split into per-module buttons (not composite)
2. ✓ Separate buttons per admin page
3. ✓ Create `/parcels/admin` page
4. ✓ No auth needed
5. ✓ **Check/Run split** — `shouldAddX()` for scheduler only, `runX()` for scheduler + on-demand
6. ✓ **Scheduler unchanged** — only runs on exact `day_of_month`, no catch-up logic
7. ✓ **On-demand uses configured date** — `runX()` inserts with `created_at = configured date`, not today
8. ✓ **No `force` flag** — check/run split makes it unnecessary

## Open Questions
1. **Feedback messages**: Show what was done (e.g., "Added allowance. New balance: 1000") or just generic "Success"? Current scheduler logs details.
2. **Button text**: "Run Now", "Execute", "Run Manually", or other?
3. **Target date calculation in `runX()`**: Calculate most recent `day_of_month` passed (if today >= config date → use current month; else → previous month). OK with this approach?
