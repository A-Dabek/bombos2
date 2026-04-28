import { test, expect } from "@playwright/test";

const TABS = [
  { label: "Parcels", path: "/parcels" },
  { label: "Meals", path: "/meals" },
  { label: "Money", path: "/money" },
  { label: "Shopping", path: "/shopping" },
];

test.describe("navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("home redirects to /parcels/incoming", async ({ page }) => {
    await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);
  });

  test("navigation works correctly", async ({ page }) => {
    // Home redirect
    await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);

    // All tabs visible + navigation loop covers visibility checks
    for (const tab of TABS) {
      await expect(page.getByRole("link", { name: tab.label })).toBeVisible();
    }

    // Navigation and active state
    for (const tab of TABS) {
      await page.getByRole("link", { name: tab.label }).click();
      const expectedPath =
        tab.path === "/parcels"
          ? "/parcels/incoming"
          : tab.path === "/meals"
            ? "/meals/dinner"
            : tab.path;
      await expect(page).toHaveURL(new RegExp(`\\${expectedPath}/?$`));
      const link = page.getByRole("link", { name: tab.label });
      await expect(link).toHaveAttribute("class", /border-blue-500/);
      await expect(link).toHaveAttribute("class", /text-blue-600/);
    }
  });
});