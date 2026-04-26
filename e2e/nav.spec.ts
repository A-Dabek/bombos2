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

  test("all four nav tabs are visible", async ({ page }) => {
    for (const tab of TABS) {
      await expect(
        page.getByRole("link", { name: tab.label })
      ).toBeVisible();
    }
  });

  test("clicking each tab navigates to correct URL", async ({ page }) => {
    for (const tab of TABS) {
      await page.getByRole("link", { name: tab.label }).click();
      const expectedPath =
        tab.path === "/parcels"
          ? "/parcels/incoming"
          : tab.path === "/meals"
            ? "/meals/breakfast"
            : tab.path;
      await expect(page).toHaveURL(new RegExp(`\\${expectedPath}/?$`));
    }
  });

  test("active tab has correct visual state", async ({ page }) => {
    for (const tab of TABS) {
      await page.getByRole("link", { name: tab.label }).click();
      const link = page.getByRole("link", { name: tab.label });
      await expect(link).toHaveAttribute(
        "class",
        /border-blue-500/
      );
      await expect(link).toHaveAttribute(
        "class",
        /text-blue-600/
      );
    }
  });
});
