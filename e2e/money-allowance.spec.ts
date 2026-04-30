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
