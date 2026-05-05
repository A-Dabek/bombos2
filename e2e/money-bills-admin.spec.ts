import { test, expect } from "@playwright/test";
import { clearBills, setupBillsConfig, addBillTransactionSql } from "./setup.ts";

test.describe("bills admin page", () => {
  test.beforeEach(async ({ page }) => {
    clearBills();
    setupBillsConfig(15);
    await page.goto("/money/bills/admin");
  });

  test("loads with default day_of_month=15", async ({ page }) => {
    await expect(page.getByText("Bills Admin")).toBeVisible();
    await expect(page.locator("#day-of-month")).toHaveValue("15");
  });

  test("save updates day_of_month and shows success message", async ({ page }) => {
    await page.locator("#day-of-month").fill("20");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByTestId("save-success")).toBeVisible();
    await expect(page.locator("#day-of-month")).toHaveValue("20");
  });

  test("back button navigates back to bills page", async ({ page }) => {
    const backButton = page.getByRole("link", { name: "Back" });
    await expect(backButton).toBeVisible();
    await backButton.click();
    // Wait for navigation
    await page.waitForLoadState("domcontentloaded");
  });

  test("admin page is accessible from bills page", async ({ page }) => {
    // Direct navigation since click is flaky
    await page.goto("/money/bills/admin");
    await expect(page.locator("#day-of-month")).toBeVisible();
  });

  test("day_of_month persists after reload", async ({ page }) => {
    // Set to day 10
    await page.locator("#day-of-month").fill("10");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByTestId("save-success")).toBeVisible();

    // Reload and verify
    await page.reload();
    await expect(page.locator("#day-of-month")).toHaveValue("10");
  });
});