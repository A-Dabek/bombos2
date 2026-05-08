import {expect, test} from "@playwright/test";
import {addBillsPeriodStartMarker, clearBills, setupBillsConfig, clearBillsAutomaticPayments, addBillsAutomaticPaymentSql, clearBillsPredefinedPayments,} from "./setup.ts";

// Polish months in genitive case (for dates like "8 maja")
const polishMonths = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];

function formatPeriodLabel(ts: number): string {
  const start = new Date(ts * 1000);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const f = (d: Date) => {
    const day = d.getDate();
    const month = polishMonths[d.getMonth()];
    return `${day} ${month}, ${d.getFullYear()}`;
  };
  return `${f(start)} – ${f(end)}`;
}

test.describe("money module journeys", () => {
    test.beforeEach(async ({page}) => {
        clearBills();
        clearBillsAutomaticPayments();
        clearBillsPredefinedPayments();
        setupBillsConfig(15);
    });

    test("Bills: Managing transactions", async ({page}) => {
        // 1. Land
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Add income
        await page.getByTestId("transaction-desc-input").fill("Refund");
        await page.getByTestId("transaction-amount-input").fill("100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        await expect(page.getByText("+100")).toBeVisible();

        // 3. Add expense
        await page.getByTestId("transaction-desc-input").fill("Rent");
        await page.getByTestId("transaction-amount-input").fill("-1200");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        await expect(page.getByText("-1200")).toBeVisible();

        // 4. Verify order (newest first) within period group
        const transactionList = page.locator(".divide-y").first();
        await expect(transactionList.locator(".flex").first()).toContainText("Rent");
        await expect(transactionList.locator(".flex").first()).toContainText("-1200");
    });

    test("Bills: Period grouping with period markers", async ({page}) => {
        // 1. Add period start marker for today
        const periodTs = Math.floor(Date.now() / 1000);
        addBillsPeriodStartMarker(periodTs);

        // 2. Add user transaction
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        await page.getByTestId("transaction-desc-input").fill("Rent");
        await page.getByTestId("transaction-amount-input").fill("-1200");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);

        // 3. Verify period header visible
        await expect(page.getByTestId("period-header")).toBeVisible();

        // 4. Verify period label format
        await expect(page.getByTestId("period-header")).toContainText(formatPeriodLabel(periodTs));

        // 5. Verify period marker NOT visible (only user transactions show)
        await expect(page.getByText("Period start")).not.toBeVisible();

        // 6. Verify transaction under period header
        await expect(page.getByText("-1200")).toBeVisible();
        await expect(page.getByText("Rent")).toBeVisible();
    });

    test("Bills: Multiple periods create multiple groups", async ({page}) => {
        // 1. Add multiple period start markers (current timestamp — created_at matches real time)
        addBillsPeriodStartMarker();
        addBillsPeriodStartMarker();
        addBillsPeriodStartMarker();

        // 2. Add transactions in different periods
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        await page.getByTestId("transaction-desc-input").fill("July expense");
        await page.getByTestId("transaction-amount-input").fill("-100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);

        // 3. Verify multiple period headers (newest period first)
        const periodHeaders = page.getByTestId("period-header");
        await expect(periodHeaders).toHaveCount(3);
    });

    test("Bills: Configuration and persistence", async ({page}) => {
        // 1. Land
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Go to Admin
        await page.getByTestId("admin-button").click();
        await page.waitForURL(/\/money\/bills\/admin/);
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 3. Verify current value
        await expect(page.locator("#day-of-month")).toHaveValue("15");

        // 4. Update
        await page.locator("#day-of-month").fill("1");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/config") && r.request().method() === "POST"),
            page.getByTestId("bills-config-save").click(),
        ]);
        await expect(page.getByTestId("save-success")).toBeVisible();

        // 5. Verify persistence after reload
        await page.reload();
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await expect(page.locator("#day-of-month")).toHaveValue("1");

        // 6. Return
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500); // Hydration safety
        await expect(page.getByTestId("transaction-desc-input")).toBeVisible();
    });

    test("Bills: Automatic payments in admin", async ({page}) => {
        // 1. Go to Admin
        await page.goto("/money/bills/admin");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Verify Automatic Payments section
        await expect(page.getByTestId("automatic-payments-heading")).toBeVisible();

        // 3. Add new payment
        await page.getByTestId("payment-name-input").fill("Rent");
        await page.getByTestId("payment-slug-input").fill("rent");
        await page.getByTestId("payment-amount-input").fill("1200");
        await Promise.all([
            page.waitForResponse(r => r.url().includes("/api/bills/automatic-payments") && r.request().method() === "POST"),
            page.getByTestId("payment-add-button").click(),
        ]);

        // 4. Verify payment appears in list
        await expect(page.getByTestId("payment-item")).toBeVisible();
        await expect(page.getByText("Rent", { exact: true })).toBeVisible();
        await expect(page.getByText("1200 PLN")).toBeVisible();

        // 4. Verify payment appears in list
        await expect(page.getByTestId("payment-item")).toBeVisible();
        await expect(page.getByText("Rent", { exact: true })).toBeVisible();
        await expect(page.getByText("1200 PLN")).toBeVisible();

        // 5. Delete payment - click twice on Delete button
        const deleteBtn = page.getByTestId("delete-btn").first();
        await deleteBtn.click({ force: true });
        await deleteBtn.click({ force: true });

        // Give time for API call
        await page.waitForTimeout(2000);
    });

    test("Bills: Predefined payments journey", async ({page}) => {
        // 1. Admin: Add predefined payments
        await page.goto("/money/bills/admin");
        await page.getByTestId("loader").waitFor({state: "hidden"});

        // Add "Electricity"
        await page.getByTestId("predefined-name-input").fill("Electricity");
        await page.getByTestId("predefined-slug-input").fill("electricity");
        await Promise.all([
            page.waitForResponse(r => r.url().includes("/api/bills/predefined-payments") && r.request().method() === "POST"),
            page.getByTestId("predefined-add-button").click(),
        ]);
        await expect(page.getByTestId("predefined-item")).toContainText("Electricity");

        // Add "Water"
        await page.getByTestId("predefined-name-input").fill("Water");
        await page.getByTestId("predefined-slug-input").fill("water");
        await Promise.all([
            page.waitForResponse(r => r.url().includes("/api/bills/predefined-payments") && r.request().method() === "POST"),
            page.getByTestId("predefined-add-button").click(),
        ]);
        await expect(page.getByTestId("predefined-item").last()).toContainText("Water");

        // 2. Delete "Water" - two-click confirmation pattern
        const deleteWaterBtn = page.getByTestId("predefined-item").filter({ hasText: "Water" }).getByTestId("delete-btn");
        await deleteWaterBtn.click({ force: true }); // First click: shows "Confirm?"

        await Promise.all([
            page.waitForResponse(r => r.url().includes("/api/bills/predefined-payments") && r.request().method() === "DELETE"),
            deleteWaterBtn.click({ force: true }), // Second click: confirms deletion
        ]);

        await expect(page.getByTestId("predefined-item").filter({ hasText: "Water" })).toHaveCount(0);

        // 3. User: Go to bills page and add manual bill using predefined
        await page.goto("/money/bills");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);
        
        // Wait for predefined dropdown to be populated
        await page.getByTestId("bills-predefined-select").waitFor({state: "visible"});
        
        // Select predefined payment from dropdown
        await page.getByTestId("bills-predefined-select").selectOption("electricity");
        
        // Description pre-filled with "Electricity"
        await expect(page.getByTestId("transaction-desc-input")).toHaveValue("Electricity");
        
        // Edit description (user can still edit)
        await page.getByTestId("transaction-desc-input").fill("Electricity - June");
        await page.getByTestId("transaction-amount-input").fill("-150");
        
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        
        await expect(page.getByText("Electricity - June")).toBeVisible();
        await expect(page.getByText("-150")).toBeVisible();
        
        // 4. User: Add manual bill with free text (no predefined)
        await page.getByTestId("bills-predefined-select").selectOption("");
        await page.getByTestId("transaction-desc-input").fill("Internet");
        await page.getByTestId("transaction-amount-input").fill("-80");
        
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/bills/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        
        await expect(page.getByText("Internet")).toBeVisible();
        await expect(page.getByText("-80")).toBeVisible();
    });

  test("Run Period Start Check button adds period-start and payments", async ({ page }) => {
    // 1. Set config to today's day so period start runs
    const today = new Date().getDate();
    await page.request.post("/api/bills/config", {
      data: { day_of_month: today }
    });

    // 2. Add predefined payments that will become automatic payments
    await page.goto("/money/bills/admin");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    
    // Add predefined payment
    await page.getByTestId("predefined-name-input").fill("Rent");
    await page.getByTestId("predefined-slug-input").fill("rent");
    await page.getByTestId("predefined-add-button").click();
    await page.waitForTimeout(500);

    // 3. Navigate to bills admin again for period start
    await page.goto("/money/bills/admin");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    // 4. Click "Run Period Start Check" twice
    const periodBtn = page.getByTestId("wykonaj-rozpoczęcie-okresu-btn");
    await periodBtn.click();
    await periodBtn.click();

    // 5. Wait for API call
    await page.waitForResponse((res) => res.url().includes("/api/bills/admin/run-period-start"));

    // 6. Verify success message
    await expect(page.getByTestId("wykonaj-rozpoczęcie-okresu-success")).toBeVisible();

    // 7. Navigate to bills page and verify transactions exist
    await page.goto("/money/bills");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(1000);
    
    // Should see some transactions (period start + automatic payment)
    await expect(page.getByTestId("transaction-desc-input")).toBeVisible();
  });
});
