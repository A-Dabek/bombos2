# Task 003: Bills Period Start — Split Check + Run + On-Demand Button

## Goal
Split `checkAndAddBillsPeriodStart()` into `shouldAddBillsPeriodStart()` + `runBillsPeriodStart()`. Add API endpoint, button, and E2E test.

## Steps

### 1. Refactor `src/db/bills.ts`
- Create `shouldAddBillsPeriodStart(db?): boolean`:
  ```typescript
  export function shouldAddBillsPeriodStart(db?: Database.Database): boolean {
    const dbConn = db ?? getDb();
    const config = getBillsConfig(dbConn);
    const today = new Date().getDate();
    return today === config.day_of_month;
  }
  ```

- Create `runBillsPeriodStart(db?)`:
  ```typescript
  export function runBillsPeriodStart(db?: Database.Database): { added: boolean } {
    const dbConn = db ?? getDb();
    const config = getBillsConfig(dbConn);
    
    // Calculate target date
    const target = getTargetDate(config.day_of_month);
    const targetTs = Math.floor(target.getTime() / 1000);
    
    // Check if period-start already exists for target's period
    const year = target.getFullYear();
    const month = target.getMonth();
    const periodStartTs = Math.floor(new Date(year, month, config.day_of_month).getTime() / 1000);
    const nextPeriodStartTs = Math.floor(new Date(year, month + 1, config.day_of_month).getTime() / 1000);
    
    const existing = dbConn.prepare(
      "SELECT id FROM bills_transactions WHERE is_automatic = 1 AND created_at >= ? AND created_at < ?"
    ).get(periodStartTs, nextPeriodStartTs);
    
    if (existing) {
      return { added: false };
    }
    
    // Add period-start marker with target date
    dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic, created_at) VALUES ('Period start', 0, 1, ?)"
    ).run(targetTs);
    
    return { added: true };
  }
  ```
  
  (Reuse `getTargetDate()` helper — consider moving to a shared utils file)

- Delete old `checkAndAddBillsPeriodStart()` function

### 2. Update `src/server/scheduler.ts`
- Create `runBillsPeriodStartCheck()`:
  ```typescript
  function runBillsPeriodStartCheck(): void {
    log("period-start", "Checking if bills period-start should be added");
    if (shouldAddBillsPeriodStart()) {
      log("period-start", "Scheduler triggered: adding bills period-start");
      const result = runBillsPeriodStart();
      if (result.added) {
        log("period-start", "Added Bills period-start.");
        try {
          const createdCount = createAutomaticPaymentTransactions();
          log("period-start", `Created ${createdCount} automatic payment transactions for Bills.`);
        } catch (err) {
          log("error", `Failed to create automatic payment transactions: ${err}`);
        }
      }
    } else {
      log("period-start", "Not the configured day for bills, skipping");
    }
  }
  ```
- Export `runBillsPeriodStart` for API use
- Update `startScheduler()` to use `runBillsPeriodStartCheck()`

### 3. Create API endpoint `src/routes/api/bills/admin/run-period-start.ts`
- POST endpoint
- Calls `runBillsPeriodStart()` then `createAutomaticPaymentTransactions()`
- Returns JSON: `{ "success": true, "periodAdded": true, "paymentsCreated": 3 }`

### 4. Add button to Bills Admin page
- Edit `src/components/bills/BillsAdmin.tsx`
- Add state: `periodLoading`, `periodError`, `periodSuccess`, `periodResult`
- Add "Run Period Start Check" button with `DoubleConfirmButton`
- On click: POST to `/api/bills/admin/run-period-start`, show result

### 5. E2E Test
Create `e2e/bills-period-start.spec.ts`:
```typescript
test("Bills period start button works", async ({ page }) => {
  // Set config to 14th
  await page.request.post("/api/bills/config", {
    data: { day_of_month: 14 }
  });
  
  // Navigate to bills admin
  await page.goto("/money/bills/admin");
  
  // Click "Run Period Start Check"
  await page.getByText("Run Period Start Check").click();
  await page.getByText("Confirm").click();
  
  // Verify success message
  await expect(page.getByText(/Added.*period-start/)).toBeVisible();
  await expect(page.getByText(/Created \d+ automatic payments/)).toBeVisible();
  
  // Verify period marker and payments added
  await page.goto("/money/bills");
  // ... verify period marker and transactions appear
});
```

## Acceptance Criteria
- [ ] `shouldAddBillsPeriodStart()` and `runBillsPeriodStart()` exported from `bills.ts`
- [ ] Old `checkAndAddBillsPeriodStart()` deleted
- [ ] Scheduler uses new check/run pattern with `createAutomaticPaymentTransactions()`
- [ ] `POST /api/bills/admin/run-period-start` works
- [ ] "Run Period Start Check" button on `/money/bills/admin`
- [ ] Button shows loading, success/error messages
- [ ] E2E test passes: `npx playwright test e2e/bills-period-start.spec.ts`
- [ ] Unit tests in `src/db/bills.test.ts` updated for new functions
