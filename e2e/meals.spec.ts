import { test, expect } from "@playwright/test";

test.describe("meals", () => {
  test("redirects /meals to /meals/breakfast", async ({ page }) => {
    await page.goto("/meals");
    await expect(page).toHaveURL(/\/meals\/breakfast\/?$/);
  });

  test("sub-navigation is visible", async ({ page }) => {
    await page.goto("/meals/breakfast");
    await expect(
      page.getByRole("link", { name: "Breakfast" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Dinner" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Supper" })
    ).toBeVisible();
  });

  test("tab switching navigates and highlights", async ({ page }) => {
    await page.goto("/meals/breakfast");
    await page.getByRole("link", { name: "Dinner" }).click();
    await expect(page).toHaveURL(/\/meals\/dinner\/?$/);
    const dinnerLink = page.getByRole("link", { name: "Dinner" });
    await expect(dinnerLink).toHaveAttribute("class", /border-blue-500/);
    await expect(dinnerLink).toHaveAttribute("class", /text-blue-600/);
  });

  test("clicking sparkles button reveals a meal", async ({ page }) => {
    await page.goto("/meals/breakfast");
    // Wait for page to load
    await page.waitForTimeout(500);
    // Click the roll button (sparkles icon button)
    const rollButton = page.locator("button").filter({ hasText: "Roll" });
    await expect(rollButton).toBeVisible();
    await rollButton.click();
    // Should show a meal name
    await expect(
      page.getByText(/(Scrambled Eggs|Oatmeal with Berries|Avocado Toast)/)
    ).toBeVisible();
  });

  test("after exhausting meals shows picky eater message", async ({ page }) => {
    await page.goto("/meals/breakfast");
    await page.waitForTimeout(500);
    const rollButton = page.locator("button").filter({ hasText: "Roll" });
    // Click 3 times to see all 3 breakfast meals
    await rollButton.click();
    await page.waitForTimeout(100);
    await rollButton.click();
    await page.waitForTimeout(100);
    await rollButton.click();
    await page.waitForTimeout(100);
    // After exhausting, should show "You're a picky eater"
    await expect(page.getByText("You're a picky eater")).toBeVisible();
  });

  test("clicking again restarts the shuffle cycle", async ({ page }) => {
    await page.goto("/meals/breakfast");
    await page.waitForTimeout(500);
    const rollButton = page.locator("button").filter({ hasText: "Roll" });
    // Exhaust the meals
    await rollButton.click();
    await page.waitForTimeout(100);
    await rollButton.click();
    await page.waitForTimeout(100);
    await rollButton.click();
    await page.waitForTimeout(100);
    // Should see picky eater message
    await expect(page.getByText("You're a picky eater")).toBeVisible();
    // Click again to restart
    await rollButton.click();
    await page.waitForTimeout(100);
    // Should show a meal name again (not the picky eater message)
    await expect(
      page.getByText(/(Scrambled Eggs|Oatmeal with Berries|Avocado Toast)/)
    ).toBeVisible();
  });
});