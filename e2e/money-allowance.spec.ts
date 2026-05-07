import { test, expect } from "@playwright/test";
import { clearAllowance, setupAllowanceConfig, addAllowanceTransactionSql } from "./setup.ts";

test.describe("Money Allowance Module Journeys", () => {
  test.beforeEach(async () => {
    clearAllowance();
    setupAllowanceConfig(15, 600);
  });

  test("User manages allowance settings and daily transactions", async ({ page }) => {
    // 1. Land on Allowance page and verify initial state
    await page.goto("/money/allowance");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    await expect(page.getByTestId("allowance-balance")).toHaveText("0");
    await expect(page.getByTestId("allowance-monthly-income")).toHaveText("+600");

    // 2. Navigate to Admin and modify configuration
    await page.getByTestId("admin-button").click();
    await expect(page).toHaveURL(/\/money\/allowance\/admin\/?$/);
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    const dayInput = page.getByTestId("allowance-config-day");
    const amountInput = page.getByTestId("allowance-config-amount");

    await expect(dayInput).toHaveValue("15");
    await expect(amountInput).toHaveValue("600");

    await dayInput.fill("20");
    await amountInput.fill("800");

    const savePromise = page.waitForResponse(
      (res) => res.url().includes("/api/allowance/config") && res.request().method() === "POST"
    );
    await page.getByTestId("allowance-config-save").click();
    await savePromise;

    await expect(page.getByTestId("save-success")).toBeVisible();

    // 3. Return to Allowance page and verify configuration reflected
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/money\/allowance\/?$/);
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    await expect(page.getByTestId("allowance-monthly-income")).toHaveText("+800");

    // 4. Add transactions and verify balance and colors
    await page.getByTestId("transaction-desc-input").fill("Freelance");
    await page.getByTestId("transaction-amount-input").fill("100");
    await page.getByTestId("transaction-add-button").click();

    await expect(page.getByText("Freelance")).toBeVisible();
    await expect(page.getByTestId("allowance-balance")).toHaveText("100");

    const incomeAmount = page.locator("text=+100").first();
    await expect(incomeAmount).toHaveClass(/text-green-600/);

    await page.getByTestId("transaction-desc-input").fill("Coffee");
    await page.getByTestId("transaction-amount-input").fill("-10");
    await page.getByTestId("transaction-add-button").click();

    await expect(page.getByText("Coffee")).toBeVisible();
    await expect(page.getByTestId("allowance-balance")).toHaveText("90");

    const expenseAmount = page.locator("text=-10").first();
    await expect(expenseAmount).toHaveClass(/text-red-600/);

    // 5. Delete last transaction and verify balance revert
    await page.getByTestId("delete-last-tx").click();
    await expect(page.getByText("Coffee")).not.toBeVisible();
    await expect(page.getByTestId("allowance-balance")).toHaveText("100");

    // Verify delete button is only on the last transaction
    // (Previous transaction "Freelance" should now have the delete button)
    await expect(page.locator("div").filter({ hasText: /^Freelance/ }).getByTestId("delete-last-tx")).toBeVisible();
  });

  test("User views transaction history grouped by periods", async ({ page }) => {
    // 1. Seed historical data directly into DB
    clearAllowance();
    setupAllowanceConfig(15, 600);

    // Create timestamps for different months
    const mayDate = new Date(2025, 4, 15); // May 15, 2025
    const juneDate = new Date(2025, 5, 15); // June 15, 2025
    const mayTimestamp = Math.floor(mayDate.getTime() / 1000);
    const juneTimestamp = Math.floor(juneDate.getTime() / 1000);

    // Add allowance-type transactions with is_automatic=true and specific dates
    addAllowanceTransactionSql("allowance", "May allowance", 600, true, mayTimestamp);
    addAllowanceTransactionSql("expense", "Lunch", 20, false, mayTimestamp + 1000);

    // Second allowance period (different month)
    addAllowanceTransactionSql("allowance", "June allowance", 600, true, juneTimestamp);
    addAllowanceTransactionSql("expense", "Dinner", 30, false, juneTimestamp + 1000);

    // 2. Land on Allowance page and verify grouping
    await page.goto("/money/allowance");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    const periodHeaders = page.getByTestId("period-header");
    await expect(periodHeaders).toHaveCount(2);

    // Newest first
    await expect(periodHeaders.first()).toHaveText("June 15th, 2025");
    await expect(periodHeaders.last()).toHaveText("May 15th, 2025");

    // Verify transactions are under correct headers
    // June 15th section should have Dinner
    const juneSection = page.locator("div").filter({ has: page.getByText("June 15th, 2025") });
    await expect(juneSection.getByText("Dinner")).toBeVisible();

    // May 15th section should have Lunch
    const maySection = page.locator("div").filter({ has: page.getByText("May 15th, 2025") });
    await expect(maySection.getByText("Lunch")).toBeVisible();
  });

test("Run Allowance Check button adds allowance", async ({ page }) => {
    // 1. Set config to today's day so check runs
    const today = new Date().getDate();
    await page.request.post("/api/allowance/config", {
      data: { day_of_month: today, monthly_amount: 600 }
    });

    // 2. Navigate to allowance admin
    await page.goto("/money/allowance/admin");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    // 3. Click "Run Allowance Check" twice
    const runBtn = page.getByTestId("run-allowance-check-btn");
    await runBtn.click();
    await runBtn.click();

    // 4. Wait for API call
    await page.waitForResponse((res) => res.url().includes("/api/allowance/admin/run-check"));

    // 5. Verify success message
    await expect(page.getByTestId("run-allowance-check-success")).toBeVisible();

    // 6. Navigate to allowance page, wait for data load, verify transaction appears
    await page.goto("/money/allowance");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(1000);
    
    // Should see non-zero balance
await expect(page.getByTestId("allowance-balance")).not.toHaveText("0");
  });
});
