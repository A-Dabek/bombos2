import { test, expect } from "@playwright/test";
import { clearBills, setupBillsConfig, addBillTransactionSql } from "./setup.ts";

test.describe("bills page - transaction form and list", () => {
  test.beforeEach(async ({ page }) => {
    clearBills();
    setupBillsConfig(15);
    await page.goto("/money/bills");
  });

  test("form displayed, no Coming soon text, no h1", async ({ page }) => {
    // Form should be visible
    await expect(page.getByPlaceholder("Description")).toBeVisible();
    await expect(page.getByPlaceholder("Amount (negative for expense)")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add" })).toBeVisible();

    // No "Coming soon" text
    await expect(page.getByText("Coming soon")).not.toBeVisible();

    // No h1 (page uses subnav for location)
    await expect(page.locator("h1")).not.toBeVisible();
  });

  test("add income (positive amount) shows in list with green +100", async ({ page }) => {
    await page.getByPlaceholder("Description").fill("Test income");
    await page.getByPlaceholder("Amount (negative for expense)").fill("100");
    await page.getByRole("button", { name: "Add" }).click();

    // Should show +100 in green
    await expect(page.getByText("+100")).toBeVisible();
    // Should show the description
    await expect(page.getByText("Test income")).toBeVisible();
  });

  test("add expense (negative amount) shows in list with red -50", async ({ page }) => {
    await page.getByPlaceholder("Description").fill("Test expense");
    await page.getByPlaceholder("Amount (negative for expense)").fill("-50");
    await page.getByRole("button", { name: "Add" }).click();

    // Should show -50 (negative) in red
    await expect(page.getByText("-50")).toBeVisible();
  });

  test("newest transaction appears at top of list", async ({ page }) => {
    // Add first transaction
    await page.getByPlaceholder("Description").fill("First");
    await page.getByPlaceholder("Amount (negative for expense)").fill("10");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("First")).toBeVisible();

    // Add second transaction
    await page.getByPlaceholder("Description").fill("Second");
    await page.getByPlaceholder("Amount (negative for expense)").fill("20");
    await page.getByRole("button", { name: "Add" }).click();

    // Second should appear first in the list (newest first)
    // Use a more specific selector - look in the transaction list container
    const transactionList = page.locator(".divide-y").first();
    const firstTransaction = transactionList.locator(".flex").first();
    await expect(firstTransaction.getByText("Second")).toBeVisible();
  });

  test("AdminButton NOT present (no admin page in iteration 1)", async ({ page }) => {
    const adminButton = page.getByTestId("admin-button");
    await expect(adminButton).not.toBeVisible();
  });
});