# Task 004: Balance Period Start — Split Check + Run + On-Demand Button

## Goal
Split `checkAndAddBalancePeriodStart()` into `shouldAddBalancePeriodStart()` + `runBalancePeriodStart()`. Add API endpoint, button, and E2E test.

## Steps

### 1. Refactor `src/db/balance.ts`
- Create `shouldAddBalancePeriodStart(db?): boolean`:
  ```typescript
  export function shouldAddBalancePeriodStart(db?: Database.Database): boolean {
    const dbConn = db ?? getDb();
    const config = getBalanceConfig(dbConn);
    const today = new Date().getDate();
    return today === config.day_of_month;
  }
  ```

- Create `runBalancePeriodStart(db?)`:
  ```typescript
  export function runBalancePeriodStart(db?: Database.Database): { added: boolean } {
    const dbConn = db ?? getDb();
    const config = getBalanceConfig(dbConn);
    
    // Calculate target date
    const target = getTargetDate(config.day_of_month);
    const targetTs = Math.floor(target.getTime() / 1000);
    
    // Check if period-start already exists for target's period
    const year = target.getFullYear();
    const month = target.getMonth();
    const periodStartTs = Math.floor(new Date(year, month, config.day_of_month).getTime() / 1000);
    const nextPeriodStartTs = Math.floor(new Date(year, month + 1, config.day_of_month).getTime() / 1000);
    
    const existing = dbConn.prepare(
      "SELECT id FROM balance_transactions WHERE is_automatic = 1 AND created_at >= ? AND created_at < ?"
    ).get(periodStartTs, nextPeriodStartTs);
    
    if (existing) {
      return { added: false };
    }
    
    // Add period-start marker with target date
    dbConn.prepare(
      "INSERT INTO balance_transactions (description, amount, is_automatic, created_at) VALUES ('Period start', 0, 1, ?)"
    ).run(targetTs);
    
    return { added: true };
  }
  ```
  
  (Reuse `getTargetDate()` helper from bills or move to shared utils)

- Delete old `checkAndAddBalancePeriodStart()` function

### 2. Update `src/server/scheduler.ts`
- Create `runBalancePeriodStartCheck()`:
  ```typescript
  function runBalancePeriodStartCheck(): void {
    log("period-start", "Checking if balance period-start should be added");
    if (shouldAddBalancePeriodStart()) {
      log("period-start", "Scheduler triggered: adding balance period-start");
      const result = runBalancePeriodStart();
      if (result.added) {
        log("period-start", "Added Balance period-start.");
      }
    } else {
      log("period-start", "Not the configured day for balance, skipping");
    }
  }
  ```
- Export `runBalancePeriodStart` for API use
- Update `startScheduler()` to use `runBalancePeriodStartCheck()`

### 3. Create API endpoint `src/routes/api/balance/admin/run-period-start.ts`
- POST endpoint
- Calls `runBalancePeriodStart()`
- Returns JSON: `{ "success": true, "added": true }`

### 4. Add button to Balance Admin page
- Edit `src/components/balance/BalanceAdmin.tsx`
- Add state: `periodLoading`, `periodError`, `periodSuccess`, `periodResult`
- Add "Run Period Start Check" button with `DoubleConfirmButton`
- On click: POST to `/api/balance/admin/run-period-start`, show result

### 5. E2E Test
Create `e2e/balance-period-start.spec.ts`:
```typescript
test("Balance period start button works", async ({ page }) => {
  // Set config to 14th
  await page.request.post("/api/balance/config", {
    data: { day_of_month: 14 }
  });
  
  // Navigate to balance admin
  await page.goto("/money/balance/admin");
  
  // Click "Run Period Start Check"
  await page.getByText("Run Period Start Check").click();
  await page.getByText("Confirm").click();
  
  // Verify success message
  await expect(page.getByText(/Added.*period-start/)).toBeVisible();
  
  // Verify period marker added
  await page.goto("/money/balance");
  // ... verify period marker appears
});
```

## Acceptance Criteria
- [ ] `shouldAddBalancePeriodStart()` and `runBalancePeriodStart()` exported from `balance.ts`
- [ ] Old `checkAndAddBalancePeriodStart()` deleted
- [ ] Scheduler uses new check/run pattern
- [ ] `POST /api/balance/admin/run-period-start` works
- [ ] "Run Period Start Check" button on `/money/balance/admin`
- [ ] Button shows loading, success/error messages
- [ ] E2E test passes: `npx playwright test e2e/balance-period-start.spec.ts`
- [ ] Unit tests in `src/db/balance.test.ts` updated for new functions
