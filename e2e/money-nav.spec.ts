import { test, expect } from "@playwright/test";
import { clearAllowance, setupAllowanceConfig } from "./setup.ts";

test.describe("money navigation and sub-nav", () => {
  test.beforeEach(async ({ page }) => {
    // Clear allowance data and setup fresh config before each test
    clearAllowance();
    setupAllowanceConfig(15, 600);
    await page.goto("/money");
    // Wait for page to be interactive (streaming blocks networkidle)
    await page.getByRole("link", { name: "Allowance" }).waitFor({ state: "visible" });
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
    // Any allowance page element visible = page loaded
    await expect(page.locator(".text-4xl.font-bold")).toBeVisible();
  });

  test("navigate to Balance tab", async ({ page }) => {
    // Use page.goto to avoid SPA nav issues with streaming
    await page.goto("/money/balance");
    // Per ADR-019: Balance page has no h1, uses form to verify page loaded
    await expect(page.getByPlaceholder("Description")).toBeVisible();
    // Check sub-nav renders active state on full page load
    const balanceTab = page.getByRole("link", { name: "Balance" });
    await expect(balanceTab).toHaveClass(/border-blue-500/);
  });

  test("navigate to Bills tab", async ({ page }) => {
    // Use page.goto to avoid SPA nav issues with streaming
    await page.goto("/money/bills");
    // Per ADR-019: Bills page has no h1, uses form to verify page loaded
    await expect(page.getByPlaceholder("Description")).toBeVisible();
    // Check sub-nav renders active state on full page load
    const billsTab = page.getByRole("link", { name: "Bills" });
    await expect(billsTab).toHaveClass(/border-blue-500/);
  });

  test("Money in top nav and navigates correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Money" })).toBeVisible();
    await page.getByRole("link", { name: "Money" }).click();
    // Wait for SPA URL change; streaming blocks networkidle
    await page.waitForFunction(
      (url) => window.location.pathname.startsWith(url),
      "/money/allowance",
      { timeout: 10000 }
    );
    await expect(page).toHaveURL(/\/money\/allowance\/?$/);
  });
});
