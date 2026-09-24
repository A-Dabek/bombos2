import { test, expect, type Page } from "@playwright/test";
import { clearGroceries, seedAisle } from "./setup";

async function fillAndSubmit(
  page: Page,
  name: string,
  options: { aisleId?: number; next?: boolean } = {},
) {
  await page.getByLabel("Nazwa *").fill(name);
  if (options.aisleId !== undefined) {
    await page.getByTestId("aisle-select").selectOption(String(options.aisleId));
  }
  const button = options.next
    ? page.getByTestId("form-next-btn")
    : page.getByTestId("form-save-btn");
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/groceries" &&
      response.request().method() === "POST",
  );
  await button.click();
  await responsePromise;
}

async function addItem(
  page: Page,
  name: string,
  options: { aisleId?: number; next?: boolean } = {},
) {
  await page.getByTestId("add-item-btn").click();
  await fillAndSubmit(page, name, options);
}

test.describe("Groceries Module @groceries", () => {
  test.beforeEach(async ({ page }) => {
    // Clear database before each test
    clearGroceries();
    await page.goto("/groceries");
  });

  test("top nav and redirection", async ({ page }) => {
    await expect(page.getByTestId("groceries-nav-link")).toBeVisible();
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
    await page.getByTestId("unit-select").selectOption("kg");
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
    await addItem(page, "Item 1");
    await addItem(page, "Item 2");

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

    // Add one item in an aisle so shopping toggles it directly
    const aisleId = seedAisle("Nabiał");
    await page.reload();
    await addItem(page, "Bread", { aisleId });

    // Still only remove all visible, but now enabled
    await expect(page.getByTestId("delete-all-btn")).toBeVisible();
    await expect(page.getByTestId("delete-all-btn")).toBeEnabled();
    await expect(page.getByTestId("delete-bought-btn")).not.toBeVisible();

    // Mark as bought (go to shopping and back)
    await page.getByTestId("sub-nav-tab-zakupy").click();
    await expect(page).toHaveURL(/\/groceries\/shopping/);

    const shoppingItem = page.getByTestId(/shopping-item-/).filter({ hasText: "Bread" });
    await shoppingItem.click();

    // Wait for bought status to be reflected in UI (ensures DB update finished)
    await expect(shoppingItem.getByText("Bread")).toHaveClass(/line-through/);

    await page.getByRole("link", { name: "Planowanie" }).click();
    await expect(page).toHaveURL(/\/groceries\/planning/);

    // Now remove bought should be visible, and remove all should NOT be visible
    await expect(page.getByTestId("delete-bought-btn")).toBeVisible();
    await expect(page.getByTestId("delete-all-btn")).not.toBeVisible();

    // Verify positions
    const deleteBoughtBtn = page.getByTestId("delete-bought-btn");
    const addItemBtn = page.getByTestId("add-item-btn");
    const itemRow = page.getByText("Bread");

    await expect(deleteBoughtBtn).toBeVisible();
    await expect(addItemBtn).toBeVisible();
    await expect(itemRow).toBeVisible();

    const deleteBoughtBox = await deleteBoughtBtn.boundingBox();
    const addItemBox = await addItemBtn.boundingBox();
    const itemBox = await itemRow.boundingBox();

    expect(deleteBoughtBox, "Delete bought button should have a bounding box").not.toBeNull();
    expect(addItemBox, "Add item button should have a bounding box").not.toBeNull();
    expect(itemBox, "Item row should have a bounding box").not.toBeNull();

    expect(deleteBoughtBox!.y).toBeLessThan(itemBox!.y);
    expect(itemBox!.y).toBeLessThan(addItemBox!.y);

    // Test removal
    await deleteBoughtBtn.click();
    await deleteBoughtBtn.click(); // Confirm
    await expect(page.getByTestId(/grocery-item-/).filter({ hasText: "Bread" })).not.toBeVisible();
  });

  test("shopping page - toggle bought status", async ({ page }) => {
    // Add item in planning and place it in an aisle
    const aisleId = seedAisle("Owoce");
    await page.reload();
    await addItem(page, "Apples", { aisleId });

    // Go to shopping
    await page.getByTestId("sub-nav-tab-zakupy").click();
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

  test("shopping page - prompts for aisle when buying unassigned item", async ({ page }) => {
    await addItem(page, "Milk");
    const aisleId = seedAisle("Nabiał");

    await page.getByTestId("sub-nav-tab-zakupy").click();
    const item = page.getByTestId(/shopping-item-/).filter({ hasText: "Milk" });
    await item.click();

    await expect(page.getByTestId("find-aisle-prompt")).toBeVisible();
    await page.getByTestId(`find-aisle-${aisleId}`).click();

    await expect(page.getByTestId("find-aisle-prompt")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Nabiał" })).toBeVisible();
    await expect(item.getByText("Milk")).toHaveClass(/line-through/);
  });

  test("sub-navigation tabs", async ({ page }) => {
    await expect(page.getByTestId("sub-nav-tab-planowanie")).toBeVisible();
    await expect(page.getByTestId("sub-nav-tab-zakupy")).toBeVisible();
    await expect(page.getByTestId("sub-nav-tab-sklepy")).toBeVisible();

    await page.getByTestId("sub-nav-tab-zakupy").click();
    await expect(page).toHaveURL(/\/groceries\/shopping/);

    await page.getByTestId("sub-nav-tab-sklepy").click();
    await expect(page).toHaveURL(/\/groceries\/shops/);

    await page.getByTestId("sub-nav-tab-planowanie").click();
    await expect(page).toHaveURL(/\/groceries\/planning/);
  });

  test.describe("Aisles", () => {
    test("can add item with aisle", async ({ page }) => {
      const aisleId = seedAisle("Nabiał");
      await page.reload();

      await addItem(page, "Banana", { aisleId });

      await expect(page.getByRole("heading", { name: "Nabiał" })).toBeVisible();
      await expect(page.getByText("Banana", { exact: true })).toBeVisible();
    });

    test("auto-fills aisle for known products", async ({ page }) => {
      const aisleId = seedAisle("Dairy");
      await page.reload();

      // Add first item with aisle (manual pick is learned)
      await addItem(page, "Milk", { aisleId });

      // Add second item with same name - aisle should be auto-filled
      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await expect(page.getByTestId("aisle-select")).toHaveValue(String(aisleId), {
        timeout: 10000,
      });
    });

    test("clears stale auto-suggestion when name changes", async ({ page }) => {
      const aisleId = seedAisle("Dairy");
      await page.reload();

      await addItem(page, "Milk", { aisleId });

      await page.getByTestId("add-item-btn").click();
      await page.getByLabel("Nazwa *").fill("Milk");
      await expect(page.getByTestId("aisle-select")).toHaveValue(String(aisleId), {
        timeout: 10000,
      });

      // Changing the name must clear the stale suggestion
      await page.getByLabel("Nazwa *").fill("Bread");
      await expect(page.getByTestId("aisle-select")).toHaveValue("");
      await page.getByTestId("form-save-btn").click();

      await expect(page.getByRole("heading", { name: "Bez alejki" })).toBeVisible();
      await expect(page.getByText("Bread", { exact: true })).toBeVisible();
    });

    test("groups items by aisle in planning", async ({ page }) => {
      const dairyId = seedAisle("Dairy");
      const fruitsId = seedAisle("Fruits");
      await page.reload();

      await addItem(page, "Milk", { aisleId: dairyId, next: true });
      await fillAndSubmit(page, "Apple", { aisleId: fruitsId });

      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "Fruits" })).toBeVisible();
    });

    test("filters and groups by aisle in shopping", async ({ page }) => {
      const dairyId = seedAisle("Dairy");
      const fruitsId = seedAisle("Fruits");
      await page.reload();

      await addItem(page, "Milk", { aisleId: dairyId, next: true });
      await fillAndSubmit(page, "Apple", { aisleId: fruitsId });

      // Go to shopping
      await page.getByTestId("sub-nav-tab-zakupy").click();

      // Default "All" view shows both
      await expect(page.getByRole("button", { name: "Dairy" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Fruits" })).toBeVisible();
      await expect(page.getByText("Milk")).toBeVisible();
      await expect(page.getByText("Apple")).toBeVisible();

      // Switch to Dairy
      await page.getByRole("button", { name: "Dairy" }).click();

      const milkInShopping = page.getByTestId(/shopping-item-/).filter({ hasText: "Milk" });
      await expect(milkInShopping).toBeVisible();

      // Mark Milk as bought (assigned, so no prompt)
      await milkInShopping.click();

      await expect(milkInShopping).toBeVisible();
      await expect(milkInShopping.locator("span").first()).toHaveClass(/line-through/);

      await expect(page.getByRole("button", { name: "Dairy ✓" })).toBeVisible();

      // Switch to "All" view to see the Dairy pill color (not selected)
      await page.getByRole("button", { name: "Wszystkie" }).click();
      const dairyPill = page.getByRole("button", { name: "Dairy ✓" });
      await expect(dairyPill).toHaveClass(/text-green-700/);

      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
    });

    test("visual cue for most recently bought item", async ({ page }) => {
      const aisleId = seedAisle("Nabiał");
      await page.reload();

      await addItem(page, "Milk", { aisleId, next: true });
      await fillAndSubmit(page, "Apple", { aisleId });

      await page.getByTestId("sub-nav-tab-zakupy").click();

      const milk = page.getByTestId(/shopping-item-/).filter({ hasText: "Milk" });
      const apple = page.getByTestId(/shopping-item-/).filter({ hasText: "Apple" });

      await milk.click();
      await expect(milk).toContainText("Ostatni");
      await expect(milk).toHaveClass(/ring-2 ring-blue-400/);

      await apple.click();
      await expect(apple).toBeVisible();

      await page.getByRole("button", { name: "Nabiał ✓" }).click();
      await expect(apple).toContainText("Ostatni");
      await expect(apple).toHaveClass(/ring-2 ring-blue-400/);

      await expect(milk).not.toContainText("Ostatni");
      await expect(milk).not.toHaveClass(/ring-2 ring-blue-400/);

      await apple.click();
      await expect(apple).not.toContainText("Ostatni");
    });

    test("manual aisle completion in shopping", async ({ page }) => {
      const aisleId = seedAisle("Dairy");
      await page.reload();

      await addItem(page, "Milk", { aisleId });

      await page.getByTestId("sub-nav-tab-zakupy").click();

      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByText("Milk", { exact: true })).toBeVisible();

      await page.getByTestId("finish-aisle-Dairy").click();

      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByText("Milk", { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Dairy ✓" }).click();
      await expect(page.getByRole("heading", { name: "Dairy" })).toBeVisible();
      await expect(page.getByTestId("finish-aisle-Dairy")).toContainText("Skończone");
    });
  });

  test("suggestions appear after removing bought items", async ({ page }) => {
    // Add an item and place it in an aisle
    const aisleId = seedAisle("Nabiał");
    await page.reload();
    await addItem(page, "Milk", { aisleId });

    // Mark as bought
    await page.getByTestId("sub-nav-tab-zakupy").click();
    const shoppingItem = page.getByTestId(/shopping-item-/).filter({ hasText: "Milk" }).filter({ has: page.locator(".text-lg") });
    await shoppingItem.click();
    await expect(shoppingItem).toHaveClass(/bg-gray-100/);
    await page.getByRole("link", { name: "Planowanie" }).click();

    // Clear bought
    await page.getByTestId("delete-bought-btn").click();
    await page.getByTestId("delete-bought-btn").click(); // Confirm

    // Suggestion should appear
    await expect(page.getByText("Sugestie")).toBeVisible();
    const suggestionBtn = page.getByRole("button", { name: "+ Milk" });
    await expect(suggestionBtn).toBeVisible();

    // Clicking suggestion adds it back
    await suggestionBtn.click();
    await expect(page.getByTestId(/grocery-item-/).filter({ hasText: "Milk" })).toBeVisible();

    // Suggestion should disappear (filtered out)
    await expect(suggestionBtn).not.toBeVisible();
  });
});
