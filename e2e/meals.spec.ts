import { test, expect } from "@playwright/test";
import Database from "better-sqlite3";

const DB_PATH = "./data/app.db";

function setupMeals() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM meals").run();
  db.exec(`
    INSERT INTO meals (category, name) VALUES
      ('dinner', 'Dinner 1'), ('dinner', 'Dinner 2'), ('dinner', 'Dinner 3'),
      ('supper', 'Supper 1'), ('supper', 'Supper 2'), ('supper', 'Supper 3')
  `);
  db.close();
}

test.describe("meals", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeEach(async () => {
    setupMeals();
  });

  test("User is able to modify dinners and randomize them", async ({ page }) => {
    await page.goto("/meals/dinner");

    // Wait for roll button
    await page.getByTestId("meal-roll-button").waitFor({ state: "visible", timeout: 5000 });

    // Roll 3 times and collect meals
    const mealsSeen = new Set<string>();
    const mealDisplay = page.locator("p.text-2xl");
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("meal-roll-button").click();
      await page.waitForTimeout(50);
      const text = await mealDisplay.textContent();
      if (text) mealsSeen.add(text);
    }
    expect(mealsSeen.size).toBe(3);

    // Click once more - see picky eater
    await page.getByTestId("meal-roll-button").click();
    await expect(page.getByText("You're a picky eater")).toBeVisible({ timeout: 5000 });

    // Go to admin, add 1, delete different
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/meals\/dinner\/admin\/?$/);

    await page.getByTestId("meal-admin-input").fill("New Dish");
    await page.getByTestId("meal-admin-add").click();
    await expect(page.getByText("New Dish")).toBeVisible();

    await page.locator("li[role='listitem']").filter({ hasText: "Dinner 1" }).getByTestId("meal-admin-delete").click();
    await expect(page.getByText("Dinner 1")).not.toBeVisible();

    // Back to meals
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/meals\/dinner\/?$/);

    // Roll again - should see different meals
    await page.getByTestId("meal-roll-button").waitFor({ state: "visible", timeout: 5000 });
    const newMealsSeen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("meal-roll-button").click();
      await page.waitForTimeout(50);
      const text = await mealDisplay.textContent();
      if (text) newMealsSeen.add(text);
    }

    // Different from original (since one was replaced)
    const overlap = [...mealsSeen].filter(m => newMealsSeen.has(m));
    expect(overlap.length).toBeLessThan(3);
  });

  test("User is able to modify suppers and randomize them", async ({ page }) => {
    await page.goto("/meals/supper");

    await page.getByTestId("meal-roll-button").waitFor({ state: "visible", timeout: 5000 });

    const mealsSeen = new Set<string>();
    const mealDisplay = page.locator("p.text-2xl");
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("meal-roll-button").click();
      await page.waitForTimeout(50);
      const text = await mealDisplay.textContent();
      if (text) mealsSeen.add(text);
    }
    expect(mealsSeen.size).toBe(3);

    await page.getByTestId("meal-roll-button").click();
    await expect(page.getByText("You're a picky eater")).toBeVisible({ timeout: 5000 });

    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/meals\/supper\/admin\/?$/);

    await page.getByTestId("meal-admin-input").fill("New Supper");
    await page.getByTestId("meal-admin-add").click();
    await expect(page.getByText("New Supper")).toBeVisible();

    await page.locator("li[role='listitem']").filter({ hasText: "Supper 1" }).getByTestId("meal-admin-delete").click();
    await expect(page.getByText("Supper 1")).not.toBeVisible();

    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/meals\/supper\/?$/);

    await page.getByTestId("meal-roll-button").waitFor({ state: "visible", timeout: 5000 });
    const newMealsSeen = new Set<string>();
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("meal-roll-button").click();
      await page.waitForTimeout(50);
      const text = await mealDisplay.textContent();
      if (text) newMealsSeen.add(text);
    }

    const overlap = [...mealsSeen].filter(m => newMealsSeen.has(m));
    expect(overlap.length).toBeLessThan(3);
  });
});