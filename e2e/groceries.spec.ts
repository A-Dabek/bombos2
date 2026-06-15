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

  test("planning page - amount and unit", async ({ page }) => {
    // Add item with default amount
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Milk");
    await page.getByTestId("form-save-btn").click();
    await expect(page.getByText("1x")).not.toBeVisible();
    await expect(page.getByText("Milk", { exact: true })).toBeVisible();

    // Add item with custom amount and unit
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Apples");
    await page.getByLabel("Ilość").fill("1.5");
    await page.locator("select").selectOption("kg");
    await page.getByTestId("form-save-btn").click();
    await expect(page.getByText("1.5kg")).toBeVisible();
    await expect(page.getByText("Apples", { exact: true })).toBeVisible();
 
    // Use +/- buttons
    await page.getByText("Milk", { exact: true }).click();
    await page.getByTestId("increase-amount-btn").click();
    await expect(page.getByText("2x")).toBeVisible();
    await page.getByTestId("decrease-amount-btn").click();
    await expect(page.getByText("1x")).not.toBeVisible();
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
    await expect(item).not.toBeVisible();

    // To see it, select "Inne" category
    await page.getByRole("button", { name: "Inne" }).click();
    await expect(item).toBeVisible();
    await expect(item).toHaveClass(/line-through/);

    // Persist on refresh
    await page.reload();
    await page.getByRole("button", { name: "Inne ✓" }).click();
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

  test.describe("Categories", () => {
    test("can add item with category", async ({ page }) => {
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Banana");
      await page.getByLabel("Kategoria").fill("Fruits");
      await page.getByTestId("form-save-btn").click();

      await expect(page.getByText("Fruits", { exact: true })).toBeVisible();
      await expect(page.getByText("Banana", { exact: true })).toBeVisible();
    });

    test("auto-fills category for known products", async ({ page }) => {
      // Add first item with category
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await page.getByLabel("Kategoria").fill("Dairy");
      await page.getByTestId("form-save-btn").click();

      // Add second item with same name
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      
      // Wait for auto-fill
      await expect(page.getByLabel("Kategoria")).toHaveValue("Dairy", { timeout: 10000 });
    });

    test("groups items by category in planning", async ({ page }) => {
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await page.getByLabel("Kategoria").fill("Dairy");
      await page.getByTestId("form-next-btn").click();

      await page.getByLabel("Nazwa *").fill("Apple");
      await page.getByLabel("Kategoria").fill("Fruits");
      await page.getByTestId("form-save-btn").click();

      await expect(page.getByText("Dairy", { exact: true })).toBeVisible();
      await expect(page.getByText("Fruits", { exact: true })).toBeVisible();
    });

    test("filters and groups by category in shopping", async ({ page }) => {
      // Add items in planning
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await page.getByLabel("Kategoria").fill("Dairy");
      await page.getByTestId("form-next-btn").click();

      await page.getByLabel("Nazwa *").fill("Apple");
      await page.getByLabel("Kategoria").fill("Fruits");
      await page.getByTestId("form-save-btn").click();

      // Go to shopping
      await page.getByRole("link", { name: "Zakupy" }).click();

      // Default "All" view shows both
      await expect(page.getByRole("button", { name: "Dairy" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Fruits" })).toBeVisible();
      await expect(page.getByText("Milk")).toBeVisible();
      await expect(page.getByText("Apple")).toBeVisible();

      // Switch to Dairy
      await page.getByRole("button", { name: "Dairy" }).click();
      
      // Find Milk in Dairy view
      const milkInShopping = page.getByTestId(/grocery-item-/).filter({ hasText: "Milk" });
      await expect(milkInShopping).toBeVisible();

      // Mark Milk as bought
      await milkInShopping.click();

      // NEW BEHAVIOR: Milk should NOT disappear from Dairy view
      await expect(milkInShopping).toBeVisible();
      await expect(milkInShopping.locator("span").first()).toHaveClass(/line-through/);

      // Category pill should be marked as completed (check checkmark first)
      await expect(page.getByRole("button", { name: "Dairy ✓" })).toBeVisible();

      // Switch to "All" view to see the Dairy pill color (not selected)
      await page.getByRole("button", { name: "Wszystkie" }).click();
      const dairyPill = page.getByRole("button", { name: "Dairy ✓" });
      await expect(dairyPill).toHaveClass(/text-green-700/);

      // Header in "All" view should be HIDDEN (requested by user to hide finished categories)
      await expect(page.getByRole("heading", { name: "Dairy" })).not.toBeVisible();
    });

    test("visual cue for most recently bought item", async ({ page }) => {
      // Add items in planning
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await page.getByTestId("form-next-btn").click();
      await page.getByLabel("Nazwa *").fill("Apple");
      await page.getByTestId("form-save-btn").click();

      // Go to shopping
      await page.getByRole("link", { name: "Zakupy" }).click();

      const milk = page.getByTestId(/grocery-item-/).filter({ hasText: "Milk" });
      const apple = page.getByTestId(/grocery-item-/).filter({ hasText: "Apple" });

      // Mark Milk as bought
      await milk.click();
      await expect(milk).toContainText("Ostatni");
      await expect(milk).toHaveClass(/ring-2 ring-blue-400/);

      // Mark Apple as bought
      await apple.click();
      // Category "Inne" should now be hidden in "All" view
      await expect(apple).not.toBeVisible();

      // Select "Inne" to see it again
      await page.getByRole("button", { name: "Inne ✓" }).click();
      await expect(apple).toContainText("Ostatni");
      await expect(apple).toHaveClass(/ring-2 ring-blue-400/);

      // Milk should no longer have the cue
      await expect(milk).not.toContainText("Ostatni");
      await expect(milk).not.toHaveClass(/ring-2 ring-blue-400/);

      // Untoggle Apple - cue should disappear or move?
      await apple.click();
      await expect(apple).not.toContainText("Ostatni");
    });

    test("remove bought items", async ({ page }) => {
      // Add two items
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Bought Item");
      await page.getByTestId("form-next-btn").click();
      await page.getByLabel("Nazwa *").fill("Unbought Item");
      await page.getByTestId("form-save-btn").click();

      // Go to shopping and mark one as bought
      await page.getByRole("link", { name: "Zakupy" }).click();
      await page.getByText("Bought Item", { exact: true }).click();

      // Go back to planning
      await page.getByRole("link", { name: "Planowanie" }).click();

      // Remove bought
      await page.getByTestId("delete-bought-btn").click();
      await page.getByTestId("delete-bought-btn").click(); // Confirm

      await expect(page.getByText("Bought Item", { exact: true })).not.toBeVisible();
      await expect(page.getByText("Unbought Item", { exact: true })).toBeVisible();
    });

    test("manual category completion in shopping", async ({ page }) => {
      // Add item with category
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await page.getByLabel("Kategoria").fill("Dairy");
      await page.getByTestId("form-save-btn").click();

      // Go to shopping
      await page.getByRole("link", { name: "Zakupy" }).click();

      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByText("Milk", { exact: true })).toBeVisible();

      // Mark as finished
      await page.getByTestId("finish-category-Dairy").click();

      // Should disappear from "All" view (default)
      await expect(page.getByRole("heading", { name: "Dairy" })).not.toBeVisible();
      await expect(page.getByText("Milk", { exact: true })).not.toBeVisible();

      // Select "Dairy" from filter to see it
      await page.getByRole("button", { name: "Dairy ✓" }).click();
      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByText("Milk", { exact: true })).toBeVisible();
      await expect(page.getByTestId("finish-category-Dairy")).toBeVisible();
      await expect(page.getByTestId("finish-category-Dairy")).toContainText("Skończone");

      // Pill should also show completion
      await expect(page.getByRole("button", { name: "Dairy ✓" })).toBeVisible();
    });
  });
});
