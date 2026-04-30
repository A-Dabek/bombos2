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
