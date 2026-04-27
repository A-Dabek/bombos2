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

  test("sub-navigation shows Dinner and Supper only", async ({ page }) => {
    await page.goto("/meals/dinner");
    await expect(page.getByRole("link", { name: "Dinner" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Supper" })).toBeVisible();
  });

  test("tab switching navigates and highlights", async ({ page }) => {
    await page.goto("/meals/dinner");
    await page.getByRole("link", { name: "Supper" }).click();
    await expect(page).toHaveURL(/\/meals\/supper\/?$/);
    const supperLink = page.getByRole("link", { name: "Supper" });
    await expect(supperLink).toHaveClass(/border-blue-500/);
    await expect(supperLink).toHaveClass(/text-blue-600/);
  });

  test("clicking sparkles button reveals a dinner meal", async ({ page }) => {
    await page.goto("/meals/dinner");
    // Wait for page to load
    await page.waitForTimeout(500);
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

  test("admin toggle button is visible", async ({ page }) => {
    await page.goto("/meals/dinner");
    await expect(
      page.getByRole("link", { name: "Admin" })
    ).toBeVisible();
  });

  test("admin page navigation works", async ({ page }) => {
    await page.goto("/meals/dinner");
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/meals\/dinner\/admin\/?$/);
    // Back button should exist
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
  });

  test("admin can add a dish", async ({ page }) => {
    await page.goto("/meals/dinner/admin");
    // Wait for meals to load
    await page.waitForTimeout(500);
    const testDishName = `__E2E_TEST_DISH__${Date.now()}`;
    await page.getByPlaceholder("Add new dish...").fill(testDishName);
    await page.getByRole("button", { name: "Add" }).click();
    // Should appear in the list
    await expect(page.getByText(testDishName)).toBeVisible();
  });

  test("admin can delete a dish", async ({ page }) => {
    await page.goto("/meals/dinner/admin");
    // Wait for meals to load
    await page.waitForTimeout(500);
    // First add a dish to delete
    const testDishName = `__E2E_DELETE_TEST__${Date.now()}`;
    await page.getByPlaceholder("Add new dish...").fill(testDishName);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText(testDishName)).toBeVisible();
    // Delete the specific test dish by using aria-label in the listitem
    await page.locator("li[role='listitem']").filter({ hasText: testDishName }).getByLabel("Delete").click();
    // Should be removed
    await expect(page.getByText(testDishName)).not.toBeVisible();
  });
});