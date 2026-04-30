import { test, expect } from "@playwright/test";

test.describe("money navigation and sub-nav", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/money");
  });

  test("redirects /money to /money/allowance", async ({ page }) => {
    await expect(page).toHaveURL(/\/money\/allowance\/?$/);
  });

  test("sub-nav shows 3 tabs: Balance, Bills, Allowance", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Balance" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Bills" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Allowance" })).toBeVisible();
  });

  test("Allowance tab active by default", async ({ page }) => {
    const allowanceTab = page.getByRole("link", { name: "Allowance" });
    await expect(allowanceTab).toHaveAttribute("class", /border-blue-500/);
    await expect(allowanceTab).toHaveAttribute("class", /text-blue-600/);
  });

  test("Allowance placeholder text visible", async ({ page }) => {
    await expect(page.getByText("Allowance coming soon.")).toBeVisible();
  });

  test("navigate to Balance tab", async ({ page }) => {
    await page.getByRole("link", { name: "Balance" }).click();
    await expect(page).toHaveURL(/\/money\/balance\/?$/);
    await expect(page.getByRole("link", { name: "Balance" })).toHaveAttribute("class", /border-blue-500/);
    await expect(page.getByText("Coming soon.")).toBeVisible();
  });

  test("navigate to Bills tab", async ({ page }) => {
    await page.getByRole("link", { name: "Bills" }).click();
    await expect(page).toHaveURL(/\/money\/bills\/?$/);
    await expect(page.getByRole("link", { name: "Bills" })).toHaveAttribute("class", /border-blue-500/);
    await expect(page.getByText("Coming soon.")).toBeVisible();
  });

  test("Money in top nav and navigates correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Money" })).toBeVisible();
    await page.getByRole("link", { name: "Money" }).click();
    await expect(page).toHaveURL(/\/money\/allowance\/?$/);
  });
});
