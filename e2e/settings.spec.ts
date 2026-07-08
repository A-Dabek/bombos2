import { expect, test } from "@playwright/test";
import { clearSettings, setHiddenTabsSql } from "./setup.ts";

test.describe("Settings journeys @settings", () => {
  test.beforeEach(() => {
    clearSettings();
  });

  test.afterEach(() => {
    clearSettings();
  });
  test("Settings: toggle tab visibility, visit hidden tab, and pre-seeded hidden tabs", async ({ page }) => {
    // 1. Open settings page — all nav tabs visible initially
    await page.goto("/settings");
    await page.getByTestId("settings-title").waitFor({ state: "visible" });

    await expect(page.getByTestId("parcels-nav-link")).toBeVisible();
    await expect(page.getByTestId("meals-nav-link")).toBeVisible();
    await expect(page.getByTestId("plan-nav-link")).toBeVisible();
    await expect(page.getByTestId("money-nav-link")).toBeVisible();
    await expect(page.getByTestId("groceries-nav-link")).toBeVisible();

    // 2. Hide "Paczki" tab (toggle triggers POST then page reload)
    await Promise.all([
      page.waitForNavigation(),
      page.getByTestId("toggle-tab-parcels").click(),
    ]);

    // 3. "Paczki" tab disappears from nav; "Visit" link appears
    await expect(page.getByTestId("parcels-nav-link")).not.toBeVisible();
    await expect(page.getByTestId("visit-tab-parcels")).toBeVisible();

    // 4. Clicking "Visit" navigates to the hidden module
    await page.getByTestId("visit-tab-parcels").click();
    await expect(page).toHaveURL(/\/parcels/);

    // 5. Go back to settings — parcels tab still hidden
    await page.goto("/settings");
    await expect(page.getByTestId("parcels-nav-link")).not.toBeVisible();

    // 6. Re-enable "Paczki" tab (toggle triggers POST then page reload)
    await Promise.all([
      page.waitForNavigation(),
      page.getByTestId("toggle-tab-parcels").click(),
    ]);

    // 7. Tab visible again; "Visit" link gone
    await expect(page.getByTestId("parcels-nav-link")).toBeVisible();
    await expect(page.getByTestId("visit-tab-parcels")).not.toBeVisible();

    // 8. Pre-seeded hidden tabs are reflected on load
    clearSettings();
    setHiddenTabsSql(["/meals", "/money"]);

    await page.goto("/settings");
    await page.getByTestId("settings-title").waitFor({ state: "visible" });

    await expect(page.getByTestId("meals-nav-link")).not.toBeVisible();
    await expect(page.getByTestId("money-nav-link")).not.toBeVisible();
    await expect(page.getByTestId("parcels-nav-link")).toBeVisible();
    await expect(page.getByTestId("plan-nav-link")).toBeVisible();
    await expect(page.getByTestId("groceries-nav-link")).toBeVisible();
    await expect(page.getByTestId("visit-tab-meals")).toBeVisible();
    await expect(page.getByTestId("visit-tab-money")).toBeVisible();
  });
})
