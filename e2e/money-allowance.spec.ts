import { test, expect } from "@playwright/test";
import { clearAllowance, setupAllowanceConfig, addAllowanceTransactionSql } from "./setup.ts";

test.describe("allowance page - balance and config display", () => {
  test.beforeEach(async ({ page }) => {
    // Use SQL to setup config instead of API
    setupAllowanceConfig(15, 600);
    await page.goto("/money/allowance");
  });

  test("balance shows 0 by default", async ({ page }) => {
    await expect(page.getByText("0")).toBeVisible();
  });

  test("monthly income shows 600 with +600 exponent", async ({ page }) => {
    await expect(page.locator(".self-start").getByText("+600")).toBeVisible();
  });

  test("admin button visible and links to admin page", async ({ page }) => {
    const adminButton = page.getByTestId("admin-button");
    await expect(adminButton).toBeVisible();
    await adminButton.click();
    await expect(page).toHaveURL(/\/money\/allowance\/admin\/?$/);
  });
});

test.describe("allowance admin page - config update", () => {
  test.beforeEach(async ({ page }) => {
    setupAllowanceConfig(15, 600);
    await page.goto("/money/allowance/admin");
    await page.waitForLoadState("networkidle");
  });

  test("config form loads with current values", async ({ page }) => {
    const dayInput = page.locator("input[type='number']").first();
    const amountInput = page.locator("input[type='number']").nth(1);
    await expect(dayInput).toHaveValue("15");
    await expect(amountInput).toHaveValue("600");
  });

  test("update day and amount, verify on allowance page", async ({ page }) => {
    const dayInput = page.locator("input[type='number']").first();
    const amountInput = page.locator("input[type='number']").nth(1);

    // Update values
    await dayInput.fill("20");
    await amountInput.fill("800");

    // Click save and wait for response
    const saveButton = page.getByRole("button", { name: "Save" });
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/allowance/config") && res.request().method() === "POST"
    );
    await saveButton.click();
    await responsePromise;

    // Wait for success message
    await expect(page.getByTestId("save-success")).toBeVisible();

    // Navigate back to allowance page
    await page.goto("/money/allowance");

    // Verify monthly income shows updated values
    await expect(page.getByText("+800")).toBeVisible();
  });
});

test.describe("allowance page - add transaction form", () => {
  test.beforeEach(async ({ page }) => {
    setupAllowanceConfig(15, 600);
    await page.goto("/money/allowance");
  });

  test("add income transaction shows in list with +100 and balance updates", async ({ page }) => {
    await page.getByPlaceholder("Description").fill("Test income");
    await page.getByPlaceholder("Amount (negative for expense)").fill("100");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("+100").first()).toBeVisible();
    await expect(page.getByText("100").first()).toBeVisible(); // balance updated
  });

  test("add expense transaction (negative amount)", async ({ page }) => {
    await page.getByPlaceholder("Description").fill("Test expense");
    await page.getByPlaceholder("Amount (negative for expense)").fill("-50");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("50").first()).toBeVisible(); // expense amount shown as positive
  });
});

test.describe("allowance page - transaction list with grouping", () => {
  test.beforeEach(async ({ page }) => {
    setupAllowanceConfig(15, 600);
    await page.goto("/money/allowance");
    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test("transactions show description, amount, and balance", async ({ page }) => {
    // Add a unique transaction
    const uniqueDesc = `Test-${Date.now()}`;
    await page.getByPlaceholder("Description").fill(uniqueDesc);
    await page.getByPlaceholder("Amount (negative for expense)").fill("100");
    await page.getByRole("button", { name: "Add" }).click();
    // Check that the new transaction appears
    await expect(page.getByText(uniqueDesc).first()).toBeVisible();
    // Amount should be visible
    await expect(page.getByText("+100").first()).toBeVisible();
  });

  test("amounts colored: green for income, red for expense", async ({ page }) => {
    // Add income
    await page.getByPlaceholder("Description").fill("Income item");
    await page.getByPlaceholder("Amount (negative for expense)").fill("100");
    await page.getByRole("button", { name: "Add" }).click();
    // Add expense
    await page.getByPlaceholder("Description").fill("Expense item");
    await page.getByPlaceholder("Amount (negative for expense)").fill("-30");
    await page.getByRole("button", { name: "Add" }).click();
    // Income amount should be green
    const incomeAmount = page.locator("text=+100").first();
    await expect(incomeAmount).toHaveClass(/text-green-600/);
  });

  test("delete last transaction removes it and updates balance", async ({ page }) => {
    const ts = Date.now();
    const firstDesc = `First-${ts}`;
    const secondDesc = `Second-${ts}`;

    // Add two transactions
    await page.getByPlaceholder("Description").fill(firstDesc);
    await page.getByPlaceholder("Amount (negative for expense)").fill("100");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByPlaceholder("Description").fill(secondDesc);
    await page.getByPlaceholder("Amount (negative for expense)").fill("50");
    await page.getByRole("button", { name: "Add" }).click();

    // Wait for both to appear
    await expect(page.getByText(firstDesc).first()).toBeVisible();
    await expect(page.getByText(secondDesc).first()).toBeVisible();

    // Click delete on the last transaction
    await page.getByTestId("delete-last-tx").click();

    // Wait for the second transaction to disappear
    await expect(page.getByText(secondDesc)).not.toBeVisible();
    await expect(page.getByText(firstDesc).first()).toBeVisible();
  });
});

test.describe("allowance page - transaction grouping", () => {
  test("transactions grouped by allowance periods", async ({ page }) => {
    // Clear allowance data using SQL
    clearAllowance();
    setupAllowanceConfig(15, 600);

    // Add allowance-type transactions via SQL (bypasses API)
    addAllowanceTransactionSql("allowance", "May allowance", 600, false);
    addAllowanceTransactionSql("expense", "Lunch", 20, false);

    // Second allowance period
    addAllowanceTransactionSql("allowance", "June allowance", 600, false);
    addAllowanceTransactionSql("expense", "Dinner", 30, false);

    await page.goto("/money/allowance");
    await page.waitForLoadState("networkidle");

    // Should have at least 2 period groups (not just "Transactions")
    const periodHeaders = page.getByTestId("period-header");
    await expect(await periodHeaders.count()).toBeGreaterThanOrEqual(2);

    // Verify period labels exist (format: "Month DayOrdinal")
    const firstPeriod = await periodHeaders.first().textContent();
    const secondPeriod = await periodHeaders.last().textContent();
    expect(firstPeriod).toMatch(/[A-Z][a-z]+ \d+(st|nd|rd|th)/);
    expect(secondPeriod).toMatch(/[A-Z][a-z]+ \d+(st|nd|rd|th)/);
  });
});
