import { test, expect } from "@playwright/test";
import { clearPlan } from "./setup";
import { createTestList, createTestItem, waitForListInUI, waitForItemInUI } from "./helpers/plan-helpers";

test.describe("plan", () => {
  test.beforeEach(async () => {
    clearPlan();
  });
  test("redirects /plan to /plan/lists", async ({ page }) => {
    await page.goto("/plan");
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });

  test("shows no lists yet when empty", async ({ page }) => {
    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');
    await expect(page.getByText("No lists yet")).toBeVisible();
  });

  test("admin navigation and button visibility", async ({ page }) => {
    await page.goto("/plan/lists");
    // Admin button visible
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
    // Navigation works
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/plan\/admin\/?$/);
    // Back button exists
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
  });

  test("admin CRUD: add, reorder, delete lists", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');
    // Add two lists
    const list1 = `__E2E_LIST_1__${Date.now()}`;
    const list2 = `__E2E_LIST_2__${Date.now() + 1}`;
    await page.getByPlaceholder("New list title...").fill(list1);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.locator("li").filter({ hasText: list1 })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder("New list title...").fill(list2);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.locator("li").filter({ hasText: list2 })).toBeVisible({ timeout: 5000 });
    // Verify list1 is first, list2 is second
    const items = page.locator("li");
    await expect(items.first()).toContainText(list1);
    await expect(items.nth(1)).toContainText(list2);
    // Reorder - click move down on list1
    const firstItem = page.locator("li").filter({ hasText: list1 }).first();
    await firstItem.locator('button[aria-label="Move down"]').click();
    await page.waitForSelector("li");
    // Now list2 should be first, list1 should be second
    await expect(items.first()).toContainText(list2);
    await expect(items.nth(1)).toContainText(list1);
    // Delete list1
    await firstItem.locator('button[aria-label="Delete"]').click();
    await expect(page.getByText(list1)).not.toBeVisible();
  });

  test("clicking a list navigates to list items view", async ({ page }) => {
    // Create a list via admin
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');
    const testListName = `__E2E_NAV_LIST__${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(testListName);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.getByText(testListName)).toBeVisible();

    // Go to lists view and click the list
    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');
    await page.getByText(testListName).click();
    await expect(page).toHaveURL(/\/plan\/\d+\/?$/);
  });

  test("list items view shows items correctly", async ({ page }) => {
    // Create a list and item via API
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", description: "Test Description", amount: 2 });

    // Navigate to list
    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Should show list title
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
    // Should show item
    await expect(page.getByText("Test Item")).toBeVisible();
    // Should show description
    await expect(page.getByText("Test Description")).toBeVisible();
    // Should show amount
    await expect(page.getByText("x2")).toBeVisible();
  });

  test("item interaction: select, show buttons, toggle, change amount", async ({ page }) => {
    // Create list and item
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", amount: 1 });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Click item to show buttons
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Decrease amount")).toBeVisible();
    await expect(page.getByLabel("Increase amount")).toBeVisible();
    await expect(page.getByLabel("Edit")).toBeVisible();
    await expect(page.getByLabel("Remove")).toBeVisible();
    // Click again to hide
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Edit")).not.toBeVisible();
    // Show again and test amount
    await page.getByText("Test Item").click();
    await expect(page.getByText("x1")).toBeVisible();
    // Increase
    await page.getByLabel("Increase amount").click();
    await page.waitForTimeout(300);
    await expect(page.getByText("x2")).toBeVisible();
    // Decrease
    await page.getByLabel("Decrease amount").click();
    await page.waitForTimeout(300);
    await expect(page.getByText("x1")).toBeVisible();
  });

  test("item edit flow: show form, edit, save, cancel", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", description: "Test Desc", amount: 3 });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Click item, then edit
    await page.getByText("Test Item").click();
    await page.getByLabel("Edit").click();
    // Form should be visible with data
    await expect(page.locator("h1").filter({ hasText: "Edit Item" })).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toHaveValue("Test Item");
    await expect(page.locator("textarea").first()).toHaveValue("Test Desc");
    await expect(page.locator('input[type="number"]').first()).toHaveValue("3");
    // Save
    await page.locator('input[type="text"]').first().fill("Updated Item");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(300);
    // Should return to list with updated
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
    await expect(page.getByText("Updated Item")).toBeVisible();
  });

  test("item add flow: show form, add, cancel", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Click Add new button
    await page.getByRole("button", { name: "Add new" }).click();
    // Form should be visible
    await expect(page.locator("h1").filter({ hasText: "Add Item" })).toBeVisible();
    // Name field should be empty
    await expect(page.locator('input[type="text"]').first()).toHaveValue("");
    // Fill and save
    await page.locator('input[type="text"]').first().fill("New Item");
    await page.locator("textarea").first().fill("New Description");
    await page.locator('input[type="number"]').first().fill("5");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(300);
    // Should return to list with new item
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
    await expect(page.getByText("New Item")).toBeVisible();
    await expect(page.getByText("New Description")).toBeVisible();
    await expect(page.getByText("x5")).toBeVisible();
    // Test cancel
    await page.getByRole("button", { name: "Add new" }).click();
    await page.locator('input[type="text"]').first().fill("Canceled Item");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);
    // Should return to list without new item
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    await expect(page.getByText("Canceled Item")).not.toBeVisible();
  });

  test("remove button deletes item immediately", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Item to Remove" });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Click item, then remove
    await page.getByText("Item to Remove").click();
    await page.getByLabel("Remove").click();
    await page.waitForTimeout(300);
    // Item should be gone
    await expect(page.getByText("Item to Remove")).not.toBeVisible();
  });

  test("remove all button deletes all items immediately", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Item 1" });
    await createTestItem(list.id, { name: "Item 2" });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Click Remove all button
    await page.getByRole("button", { name: "Remove all" }).click();
    await page.waitForTimeout(300);
    // Should show no items message
    await expect(page.getByText("No items yet")).toBeVisible();
  });

  test("back button returns to lists view from list items", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items"]');
    // Click Back button
    await page.getByRole("link", { name: "Back" }).click();
    // Should be at lists view
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });

  test("back button returns to lists view from admin", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');
    // Click Back button
    await page.getByRole("link", { name: "Back" }).click();
    // Should be at lists view
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });
});