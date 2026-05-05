import { test, expect } from "@playwright/test";
import {
  clearBalance,
  setupBalanceConfig,
  clearBills,
  setupBillsConfig,
  clearAllowance,
  setupAllowanceConfig,
} from "./setup.ts";

test.describe("money module journeys", () => {
  test.beforeEach(async ({ page }) => {
    clearBalance();
    setupBalanceConfig(15);
    clearBills();
    setupBillsConfig(15);
    clearAllowance();
    setupAllowanceConfig(15, 600);
  });

  test("Navigation Journey", async ({ page }) => {
    // Top-level /money redirects to /money/allowance
    await page.goto("/money");
    await expect(page).toHaveURL(/\/money\/allowance\/?$/);

    // Sub-nav visibility
    await expect(page.getByTestId("sub-nav-tab-balance")).toBeVisible();
    await expect(page.getByTestId("sub-nav-tab-bills")).toBeVisible();
    await expect(page.getByTestId("sub-nav-tab-allowance")).toBeVisible();

    // Allowance tab active by default
    await expect(page.getByTestId("sub-nav-tab-allowance")).toHaveClass(/border-blue-500/);

    // SPA Navigation to Balance
    await page.getByTestId("sub-nav-tab-balance").click();
    await expect(page).toHaveURL(/\/money\/balance\/?$/);
    await expect(page.getByPlaceholder("Description")).toBeVisible();
    await expect(page.getByTestId("sub-nav-tab-balance")).toHaveClass(/border-blue-500/);

    // SPA Navigation to Bills
    await page.getByTestId("sub-nav-tab-bills").click();
    await expect(page).toHaveURL(/\/money\/bills\/?$/);
    await expect(page.getByPlaceholder("Description")).toBeVisible();
    await expect(page.getByTestId("sub-nav-tab-bills")).toHaveClass(/border-blue-500/);

    // Navigation from Home
    await page.goto("/");
    await page.getByRole("link", { name: "Money" }).click();
    await page.waitForURL(/\/money\/allowance\/?$/);
    await expect(page).toHaveURL(/\/money\/allowance\/?$/);
  });

  test("Balance Journey", async ({ page }) => {
    // 1. Land
    await page.goto("/money/balance");
    await expect(page.getByTestId("loader")).not.toBeVisible();

    // 2. Interact: Add transactions
    await page.getByPlaceholder("Description").fill("Income");
    await page.getByPlaceholder("Amount (negative for expense)").fill("1000");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("+1000")).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("Description").fill("Expense");
    await page.getByPlaceholder("Amount (negative for expense)").fill("-200");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("-200")).toBeVisible({ timeout: 10000 });

    // Verify newest first
    const transactionList = page.locator(".divide-y").first();
    await expect(transactionList.locator(".flex").first()).toContainText("Expense");

    // 3. Modify: Change settings in Admin
    await page.getByTestId("admin-button").click();
    await expect(page).toHaveURL(/\/money\/balance\/admin\/?$/);
    await expect(page.getByTestId("loader")).not.toBeVisible();
    await expect(page.locator("#day-of-month")).toHaveValue("15");

    await page.locator("#day-of-month").fill("25");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("save-success")).toBeVisible({ timeout: 10000 });

    // Verify persistence
    await page.reload();
    await expect(page.getByTestId("loader")).not.toBeVisible();
    await expect(page.locator("#day-of-month")).toHaveValue("25");

    // 4. Verify: Return and check
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/money\/balance\/?$/);
    await expect(page.getByTestId("loader")).not.toBeVisible();
    await expect(page.getByText("Income")).toBeVisible();
  });

  test("Bills Journey", async ({ page }) => {
    // 1. Land
    await page.goto("/money/bills");
    await expect(page.getByTestId("loader")).not.toBeVisible();

    // 2. Interact: Add transactions
    await page.getByPlaceholder("Description").fill("Salary");
    await page.getByPlaceholder("Amount (negative for expense)").fill("5000");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("+5000")).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder("Description").fill("Rent");
    await page.getByPlaceholder("Amount (negative for expense)").fill("-1500");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("-1500")).toBeVisible({ timeout: 10000 });

    // Verify newest first
    const transactionList = page.locator(".divide-y").first();
    await expect(transactionList.locator(".flex").first()).toContainText("Rent");

    // 3. Modify: Change settings in Admin
    await page.getByTestId("admin-button").click();
    await expect(page).toHaveURL(/\/money\/bills\/admin\/?$/);
    await expect(page.getByTestId("loader")).not.toBeVisible();
    await expect(page.locator("#day-of-month")).toHaveValue("15");

    await page.locator("#day-of-month").fill("1");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("save-success")).toBeVisible({ timeout: 10000 });

    // Verify persistence
    await page.reload();
    await expect(page.getByTestId("loader")).not.toBeVisible();
    await expect(page.locator("#day-of-month")).toHaveValue("1");

    // 4. Verify: Return and check
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/money\/bills\/?$/);
    await expect(page.getByTestId("loader")).not.toBeVisible();
    await expect(page.getByText("Salary")).toBeVisible();
  });
});
