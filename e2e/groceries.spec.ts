import { test, expect } from "@playwright/test";
import { clearGroceries } from "./setup";

test.describe("Groceries Module", () => {
  test.beforeEach(async ({ page }) => {
    // Clear database before each test
    clearGroceries();
    await page.goto("/groceries");
  });

  test("top nav and redirection", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Spożywcze" })).toBeVisible();
    await expect(page).toHaveURL(/\/groceries\/planning/);
  });

  test("planning page - empty state", async ({ page }) => {
    await expect(page.getByTestId("empty-state")).toContainText("Brak pozycji");
  });

  test("planning page - CRUD item", async ({ page }) => {
    // Add item
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Milk");
    await page.getByLabel("Opis").fill("1L whole milk");
    await page.getByLabel("Pilne").check();
    await page.getByTestId("form-save-btn").click();

    await expect(page.getByText("Milk", { exact: true })).toBeVisible();
    await expect(page.getByText("1L whole milk", { exact: true })).toBeVisible();
    await expect(page.getByText("Milk", { exact: true })).toHaveClass(/text-red-600/);

    // Edit item
    await page.getByText("Milk", { exact: true }).click();
    await page.getByTestId("edit-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Water");
    await page.getByLabel("Pilne").uncheck();
    await page.getByTestId("form-save-btn").click();

    await expect(page.getByText("Water", { exact: true })).toBeVisible();
    await expect(page.getByText("Milk", { exact: true })).not.toBeVisible();
    await expect(page.getByText("Water", { exact: true })).not.toHaveClass(/text-red-600/);

    // Delete item
    await page.getByText("Water", { exact: true }).click();
    await page.getByTestId("delete-item-btn").click();
    await page.getByTestId("delete-item-btn").click(); // Second click to confirm

    await expect(page.getByText("Water", { exact: true })).not.toBeVisible();
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });

  test("planning page - remove all", async ({ page }) => {
    // Add two items
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Item 1");
    await page.getByTestId("form-save-btn").click();
    
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Item 2");
    await page.getByTestId("form-save-btn").click();

    await expect(page.getByText("Item 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Item 2", { exact: true })).toBeVisible();

    // Remove all
    await page.getByTestId("delete-all-btn").click();
    await page.getByTestId("delete-all-btn").click(); // Second click to confirm

    await expect(page.getByText("Item 1", { exact: true })).not.toBeVisible();
    await expect(page.getByText("Item 2", { exact: true })).not.toBeVisible();
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });

  test("shopping page - toggle bought status", async ({ page }) => {
    // Add item in planning
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Apples");
    await page.getByTestId("form-save-btn").click();

    // Go to shopping
    await page.getByRole("link", { name: "Zakupy" }).click();
    await expect(page).toHaveURL(/\/groceries\/shopping/);

    const item = page.getByText("Apples", { exact: true });
    await expect(item).toBeVisible();
    await expect(item).not.toHaveClass(/line-through/);

    // Toggle bought
    await item.click();
    await expect(item).toHaveClass(/line-through/);

    // Persist on refresh
    await page.reload();
    await expect(page.getByText("Apples", { exact: true })).toHaveClass(/line-through/);

    // Untoggle
    await page.getByText("Apples", { exact: true }).click();
    await expect(page.getByText("Apples", { exact: true })).not.toHaveClass(/line-through/);
  });

  test("sub-navigation tabs", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Planowanie" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Zakupy" })).toBeVisible();

    await page.getByRole("link", { name: "Zakupy" }).click();
    await expect(page).toHaveURL(/\/groceries\/shopping/);

    await page.getByRole("link", { name: "Planowanie" }).click();
    await expect(page).toHaveURL(/\/groceries\/planning/);
  });
});
