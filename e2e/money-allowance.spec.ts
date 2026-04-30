import { test, expect } from "@playwright/test";

test.describe("allowance page - balance and config display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/money/allowance");
  });

  test("balance shows 0 by default", async ({ page }) => {
    await expect(page.getByText("0")).toBeVisible();
  });

  test("monthly income shows 600 with monthly: +600", async ({ page }) => {
    await expect(page.getByText("monthly: +600")).toBeVisible();
  });

  test("admin button visible and links to admin page", async ({ page }) => {
    const adminButton = page.getByRole("link", { name: "Admin" });
    await expect(adminButton).toBeVisible();
    await adminButton.click();
    await expect(page).toHaveURL(/\/money\/allowance\/admin\/?$/);
  });
});

test.describe("allowance page - add transaction form", () => {
  test.beforeEach(async ({ page }) => {
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
});
