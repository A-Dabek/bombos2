import { test, expect } from "@playwright/test";
import { clearMeals, clearPlan } from "./setup";

test.describe("meals", () => {
  test.beforeEach(async () => {
    clearPlan();
    clearMeals();
  });
  test("redirects /meals to /meals/dinner", async ({ page }) => {
    await page.goto("/meals");
    await expect(page).toHaveURL(/\/meals\/dinner\/?$/);
  });

  test("sub-navigation and tab switching", async ({ page }) => {
    await page.goto("/meals/dinner");
    // Dinner and Supper visible
    await expect(page.getByRole("link", { name: "Dinner" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Supper" })).toBeVisible();
    // Tab switching + highlighting
    await page.getByRole("link", { name: "Supper" }).click();
    await expect(page).toHaveURL(/\/meals\/supper\/?$/);
    const supperLink = page.getByRole("link", { name: "Supper" });
    await expect(supperLink).toHaveClass(/border-blue-500/);
    await expect(supperLink).toHaveClass(/text-blue-600/);
  });

  test("clicking sparkles button reveals a dinner meal", async ({ page }) => {
    await page.goto("/meals/dinner");
    // Wait for page to load
    await page.getByRole("button", { name: "Roll" }).waitFor();
    await page.waitForLoadState("networkidle");
    // Click the roll button (sparkles icon button)
    const rollButton = page.locator("button").filter({ hasText: "Roll" });
    await expect(rollButton).toBeVisible();
    await rollButton.click();
    // Should show a meal name (one of the 33 dinner meals)
    const mealText = page.locator("p.text-2xl");
    await expect(mealText).toBeVisible();
    const text = await mealText.textContent();
    // Verify it's a dinner meal (not empty)
    expect(text?.length).toBeGreaterThan(0);
  });

  test("admin navigation and toggle button", async ({ page }) => {
    await page.goto("/meals/dinner");
    // Admin button visible
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
    // Navigation works
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/meals\/dinner\/admin\/?$/);
    // Back button exists
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
  });

   test("back button returns to meals view from admin", async ({ page }) => {
     await page.goto("/meals/dinner/admin");
     await page.waitForLoadState("networkidle");
     await page.getByRole("link", { name: "Back" }).click();
     await expect(page).toHaveURL(/\/meals\/dinner\/?$/);
   });

   test("admin CRUD: add and delete dish", async ({ page }) => {
    await page.goto("/meals/dinner/admin");
    // Wait for meals to load
    await page.waitForSelector("li[role='listitem']", { state: "visible" }).catch(() => {});
    await page.waitForLoadState("networkidle");
    // Add dish
    const testDishName = `__E2E_TEST_DISH__${Date.now()}`;
    await page.getByPlaceholder("Add new dish...").fill(testDishName);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(testDishName)).toBeVisible();
    // Delete the dish
    await page.locator("li[role='listitem']").filter({ hasText: testDishName }).getByLabel("Delete").click();
    // Should be removed
    await expect(page.getByText(testDishName)).not.toBeVisible();
  });
});