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

  test("planning page - last added marker", async ({ page }) => {
    // Add first item
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Milk");
    await page.getByTestId("form-save-btn").click();

    const milkItem = page.locator("li", { hasText: "Milk" });
    await expect(milkItem).toContainText("Ostatni");
    await expect(milkItem).toHaveClass(/ring-2 ring-blue-400/);

    // Add second item via 'Next'
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Bread");
    await page.getByTestId("form-next-btn").click();

    const breadItem = page.locator("li", { hasText: "Bread" });
    await expect(breadItem).toContainText("Ostatni");
    await expect(breadItem).toHaveClass(/ring-2 ring-blue-400/);

    // First item should no longer have the marker
    await expect(milkItem).not.toContainText("Ostatni");
    await expect(milkItem).not.toHaveClass(/ring-2 ring-blue-400/);
    
    // Close form
    await page.getByTestId("form-cancel-btn").click();
    
    // Bread should still have the marker
    await expect(breadItem).toContainText("Ostatni");
  });

  test("planning page - form feedback after clicking Next", async ({ page }) => {
    await page.getByTestId("add-item-btn").click();
    
    // No feedback initially
    await expect(page.getByTestId("form-feedback")).not.toBeVisible();

    // Add first item via Next
    await page.getByLabel("Nazwa *").fill("Milk");
    await page.getByTestId("form-next-btn").click();

    // Feedback should be visible
    await expect(page.getByTestId("form-feedback")).toBeVisible();
    await expect(page.getByTestId("form-feedback")).toContainText("Poprzednio dodano: Milk");

    // Close and reopen form - feedback should be gone
    await page.getByTestId("form-cancel-btn").click();
    await page.getByTestId("add-item-btn").click();
    await expect(page.getByTestId("form-feedback")).not.toBeVisible();
  });

  test("planning page - remove buttons layout and mutual exclusivity", async ({ page }) => {
    // Empty state - remove all should be visible but disabled
    await expect(page.getByTestId("delete-all-btn")).toBeVisible();
    await expect(page.getByTestId("delete-all-btn")).toBeDisabled();
    await expect(page.getByTestId("delete-bought-btn")).not.toBeVisible();

    // Add one item (not bought)
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Bread");
    await page.getByTestId("form-save-btn").click();

    // Still only remove all visible, but now enabled
    await expect(page.getByTestId("delete-all-btn")).toBeVisible();
    await expect(page.getByTestId("delete-all-btn")).toBeEnabled();
    await expect(page.getByTestId("delete-bought-btn")).not.toBeVisible();

    // Mark as bought (go to shopping and back)
    await page.getByRole("link", { name: "Zakupy" }).click();
    await page.getByText("Bread").click();
    await page.getByRole("link", { name: "Planowanie" }).click();

    // Now remove bought should be visible, and remove all should NOT be visible
    await expect(page.getByTestId("delete-bought-btn")).toBeVisible();
    await expect(page.getByTestId("delete-all-btn")).not.toBeVisible();

    // Verify positions
    const deleteBoughtBtn = page.getByTestId("delete-bought-btn");
    const addItemBtn = page.getByTestId("add-item-btn");
    const itemRow = page.getByText("Bread");

    const deleteBoughtBox = await deleteBoughtBtn.boundingBox();
    const addItemBox = await addItemBtn.boundingBox();
    const itemBox = await itemRow.boundingBox();

    expect(deleteBoughtBox!.y).toBeLessThan(itemBox!.y);
    expect(itemBox!.y).toBeLessThan(addItemBox!.y);
    
    // Test removal
    await deleteBoughtBtn.click();
    await deleteBoughtBtn.click(); // Confirm
    await expect(page.getByText("Bread")).not.toBeVisible();
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
    await expect(item).toBeVisible();
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

      // Header in "All" view should be VISIBLE (now we show finished categories at the bottom)
      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
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
      // Category "Inne" should now be VISIBLE at the bottom in "All" view
      await expect(apple).toBeVisible();

      // Select "Inne" to see it (it was already visible, but this tests filtering)
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

      // Should stay visible in "All" view but sorted last
      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByText("Milk", { exact: true })).toBeVisible();

      // Select "Dairy" from filter
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
