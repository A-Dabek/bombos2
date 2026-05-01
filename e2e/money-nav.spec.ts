import { test, expect } from "@playwright/test";
import { clearAllowance, setupAllowanceConfig } from "./setup.ts";

test.describe("money navigation and sub-nav", () => {
  test.beforeEach(async ({ page }) => {
    // Clear allowance data and setup fresh config before each test
    clearAllowance();
    setupAllowanceConfig(15, 600);
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

  test("Allowance page elements visible", async ({ page }) => {
    // Clear allowance data and setup fresh config
    // (uses SQL helpers via setup)
    await page.goto("/money/allowance");
    // Check that allowance page is loaded (sub-nav active + balance display)
    const allowanceTab = page.getByRole("link", { name: "Allowance" });
    await expect(allowanceTab).toHaveAttribute("class", /border-blue-500/);
    // Balance display should show 0 for fresh DB
    await expect(page.getByText("0")).toBeVisible();
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
