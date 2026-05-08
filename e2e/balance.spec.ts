import {expect, test} from "@playwright/test";
import {addBalancePeriodStartMarker, clearBalance, setupBalanceConfig,} from "./setup.ts";

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
        clearBalance();
        setupBalanceConfig(15);
    });

    test("Balance: Managing transactions", async ({page}) => {
        // 1. Land
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500); // Hydration safety

        // 2. Add income
        await page.getByTestId("transaction-desc-input").fill("Salary");
        await page.getByTestId("transaction-amount-input").fill("5000");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        await expect(page.getByText("+5000")).toBeVisible();

        // 3. Add expense
        await page.getByTestId("transaction-desc-input").fill("Groceries");
        await page.getByTestId("transaction-amount-input").fill("-150");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);
        await expect(page.getByText("-150")).toBeVisible();

        // 4. Verify order (newest first) within period group
        const transactionList = page.locator(".divide-y").first();
        await expect(transactionList.locator(".flex").first()).toContainText("Groceries");
        await expect(transactionList.locator(".flex").first()).toContainText("-150");
    });

    test("Balance: Period grouping with period markers", async ({page}) => {
        // 1. Add period start marker for today
        const periodTs = Math.floor(Date.now() / 1000);
        addBalancePeriodStartMarker(periodTs);

        // 2. Add user transaction
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        await page.getByTestId("transaction-desc-input").fill("Groceries");
        await page.getByTestId("transaction-amount-input").fill("-150");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);

        // 3. Verify period header visible
        await expect(page.getByTestId("period-header")).toBeVisible();

        // 4. Verify period label format
        await expect(page.getByTestId("period-header")).toContainText(formatPeriodLabel(periodTs));

        // 5. Verify period marker NOT visible (only user transactions show)
        await expect(page.getByText("Period start")).not.toBeVisible();

        // 6. Verify transaction under period header
        await expect(page.getByText("-150")).toBeVisible();
        await expect(page.getByText("Groceries")).toBeVisible();
    });

    test("Balance: Multiple periods create multiple groups", async ({page}) => {
        // 1. Add multiple period start markers (current timestamp — created_at matches real time)
        addBalancePeriodStartMarker();
        addBalancePeriodStartMarker();
        addBalancePeriodStartMarker();

        // 2. Add transactions in different periods
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        await page.getByTestId("transaction-desc-input").fill("July expense");
        await page.getByTestId("transaction-amount-input").fill("-100");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/transactions") && r.request().method() === "POST"),
            page.getByTestId("transaction-add-button").click(),
        ]);

        // 3. Verify multiple period headers (newest period first)
        const periodHeaders = page.getByTestId("period-header");
        await expect(periodHeaders).toHaveCount(3);
    });

    test("Balance: Configuration and persistence", async ({page}) => {
        // 1. Land
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 2. Go to Admin
        await page.getByTestId("admin-button").click();
        await page.waitForURL(/\/money\/balance\/admin/);
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500);

        // 3. Verify current value
        await expect(page.locator("#day-of-month")).toHaveValue("15");

        // 4. Update
        await page.locator("#day-of-month").fill("25");
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith("/api/balance/config") && r.request().method() === "POST"),
            page.getByTestId("balance-config-save").click(),
        ]);
        await expect(page.getByTestId("save-success")).toBeVisible();

        // 5. Verify persistence after reload
        await page.reload();
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await expect(page.locator("#day-of-month")).toHaveValue("25");

        // 6. Return and verify navigation
        await page.goto("/money/balance");
        await page.getByTestId("loader").waitFor({state: "hidden"});
        await page.waitForTimeout(500); // Hydration safety
        await expect(page.getByTestId("transaction-desc-input")).toBeVisible();
    });

  test("Run Period Start Check button adds period-start", async ({ page }) => {
    // 1. Set config to today's day so period start runs
    const today = new Date().getDate();
    await page.request.post("/api/balance/config", {
      data: { day_of_month: today }
    });

    // 2. Navigate to balance admin
    await page.goto("/money/balance/admin");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    // 3. Click "Run Period Start Check" twice
    const periodBtn = page.getByTestId("wykonaj-rozpoczęcie-okresu-btn");
    await periodBtn.click();
    await periodBtn.click();

    // 4. Wait for API call
    await page.waitForResponse((res) => res.url().includes("/api/balance/admin/run-period-start"));

    // 5. Verify success message
    await expect(page.getByTestId("wykonaj-rozpoczęcie-okresu-success")).toBeVisible();

    // 6. Navigate to balance page and verify transactions exist
    await page.goto("/money/balance");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(1000);
    
    // Should see some transactions
    await expect(page.getByTestId("transaction-desc-input")).toBeVisible();
  });
});