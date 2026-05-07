# Task 002: Allowance — Split Check + Run + On-Demand Button

## Goal
Split `checkAndAddAllowance()` into `shouldAddAllowance()` + `runAllowance()`. Add API endpoint, button, and E2E test.

## Steps

### 1. Refactor `src/db/allowance.ts`
- Create `shouldAddAllowance(db?): boolean`:
  ```typescript
  export function shouldAddAllowance(db?: Database.Database): boolean {
    const dbConn = db ?? getDb();
    const config = getAllowanceConfig(dbConn);
    const today = new Date().getDate();
    return today === config.day_of_month;
  }
  ```

- Create `runAllowance(db?)`:
  ```typescript
  export function runAllowance(db?: Database.Database): { added: boolean; newBalance: number } {
    const dbConn = db ?? getDb();
    const config = getAllowanceConfig(dbConn);
    
    // Calculate target date (most recent day_of_month that passed)
    const target = getTargetDate(config.day_of_month);
    const targetTs = Math.floor(target.getTime() / 1000);
    
    // Check if already processed for target's period
    const year = target.getFullYear();
    const month = target.getMonth();
    const startOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000);
    const startOfNextMonth = Math.floor(new Date(year, month + 1, 1).getTime() / 1000);
    
    const existing = dbConn.prepare(
      "SELECT id FROM allowance_transactions WHERE type = 'allowance' AND created_at >= ? AND created_at < ?"
    ).get(startOfMonth, startOfNextMonth) as { id: number } | undefined;
    
    if (existing) {
      return { added: false, newBalance: getCurrentBalance(dbConn) };
    }
    
    // Add allowance transaction with target date
    const description = `${target.toLocaleString("en-US", { month: "long" })} allowance`;
    addAllowanceTransaction("allowance", description, config.monthly_amount, dbConn, true, targetTs);
    
    return { added: true, newBalance: getCurrentBalance(dbConn) };
  }
  
  function getTargetDate(dayOfMonth: number): Date {
    const today = new Date();
    if (today.getDate() >= dayOfMonth) {
      return new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    } else {
      return new Date(today.getFullYear(), today.getMonth() - 1, dayOfMonth);
    }
  }
  ```

- Delete old `checkAndAddAllowance()` function

### 2. Update `src/server/scheduler.ts`
- Create `runAllowanceCheck()`:
  ```typescript
  function runAllowanceCheck(): void {
    log("allowance", "Checking if allowance should be added");
    if (shouldAddAllowance()) {
      log("allowance", "Scheduler triggered: adding allowance");
      const result = runAllowance();
      if (result.added) {
        log("allowance", `Added allowance. New balance: ${result.newBalance}`);
      }
    } else {
      log("allowance", "Not the configured day, skipping");
    }
  }
  ```
- Export `runAllowance` for API use
- Update `startScheduler()` to use `runAllowanceCheck()`

### 3. Create API endpoint `src/routes/api/allowance/admin/run-check.ts`
- POST endpoint
- Calls `runAllowance()` from scheduler
- Returns JSON: `{ "success": true, "added": true, "newBalance": 1000 }`

### 4. Add button to Allowance Admin page
- Edit `src/components/allowance/AllowanceAdmin.tsx`
- Add state: `runLoading`, `runError`, `runSuccess`, `runResult`
- Add "Run Allowance Check" button with `DoubleConfirmButton`
- On click: POST to `/api/allowance/admin/run-check`, show result message

### 5. E2E Test
Create `e2e/allowance-check.spec.ts`:
```typescript
test("Allowance check button works", async ({ page }) => {
  // Set config to 14th (or any date)
  await page.request.post("/api/allowance/config", {
    data: { day_of_month: 14, monthly_amount: 600 }
  });
  
  // Navigate to allowance admin
  await page.goto("/money/allowance/admin");
  
  // Click "Run Allowance Check"
  await page.getByText("Run Allowance Check").click();
  await page.getByText("Confirm").click();
  
  // Verify success message
  await expect(page.getByText(/Added allowance/)).toBeVisible();
  
  // Verify transaction added via API check or UI
  await page.goto("/money/allowance");
  // ... verify transaction appears
});
```

## Acceptance Criteria
- [ ] `shouldAddAllowance()` and `runAllowance()` exported from `allowance.ts`
- [ ] Old `checkAndAddAllowance()` deleted
- [ ] Scheduler uses `shouldAddAllowance()` + `runAllowance()` pattern
- [ ] `POST /api/allowance/admin/run-check` works
- [ ] "Run Allowance Check" button on `/money/allowance/admin`
- [ ] Button shows loading, success/error messages
- [ ] E2E test passes: `npx playwright test e2e/allowance-check.spec.ts`
- [ ] Unit tests in `src/db/allowance.test.ts` updated for new functions
