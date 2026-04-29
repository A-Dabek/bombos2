import { test, expect } from "@playwright/test";
import { clearPlan } from "./setup";
import { createTestList, createTestItem } from "./helpers/plan-helpers";

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
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/plan\/admin\/?$/);
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
  });

  // Flaky: delete confirmation sometimes doesn't propagate in time
  test("admin CRUD: add, reorder, delete lists", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');

    const list1 = `__E2E_LIST_1__${Date.now()}`;
    const list2 = `__E2E_LIST_2__${Date.now() + 1}`;

    // Add list1
    await page.getByPlaceholder("New list title...").fill(list1);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.locator("li").filter({ hasText: list1 })).toBeVisible({ timeout: 5000 });

    // Add list2
    await page.getByPlaceholder("New list title...").fill(list2);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.locator("li").filter({ hasText: list2 })).toBeVisible({ timeout: 5000 });

    // Verify order
    const items = page.locator("li");
    await expect(items.first()).toContainText(list1);
    await expect(items.nth(1)).toContainText(list2);

    // Reorder - move list1 down
    const firstItem = page.locator("li").filter({ hasText: list1 }).first();
    await firstItem.locator('button[aria-label="Move down"]').click();
    await page.waitForTimeout(500);
    await expect(items.first()).toContainText(list2);
    await expect(items.nth(1)).toContainText(list1);

    // Delete list1 - double-click confirmation
    // First click
    await page.locator("li").filter({ hasText: list1 }).first().locator('[data-testid="admin-delete-btn"]').click({ force: true });
    await expect(page.locator("li").filter({ hasText: list1 }).first().locator('[data-testid="admin-delete-btn"]')).toHaveClass(/animate-bounce/);

    // Second click
    await page.locator("li").filter({ hasText: list1 }).first().locator('[data-testid="admin-delete-btn"]').click({ force: true });
    await expect(page.getByText(list1)).not.toBeVisible({ timeout: 5000 });
  });

  test("clicking a list navigates to list items view", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');
    const testListName = `__E2E_NAV_LIST__${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(testListName);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.getByText(testListName)).toBeVisible();

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');
    await page.getByText(testListName).click();
    await expect(page).toHaveURL(/\/plan\/\d+\/?$/);
  });

  test("list items view shows items correctly", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", description: "Test Description", amount: 2 });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
    await expect(page.getByText("Test Item")).toBeVisible();
    await expect(page.getByText("Test Description")).toBeVisible();
    await expect(page.getByText("x2")).toBeVisible();
  });

  test("item interaction: select, show buttons, toggle, change amount", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", amount: 1 });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click item to show buttons
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Decrease amount")).toBeVisible();
    await expect(page.getByLabel("Increase amount")).toBeVisible();
    await expect(page.getByLabel("Edit")).toBeVisible();

    const itemRemoveBtn = page
      .locator('[data-testid="plan-items-container"]')
      .getByLabel("Remove", { exact: true });
    await expect(itemRemoveBtn).toBeVisible();

    // Click again to hide
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Edit")).not.toBeVisible();

    // Show again and test amount
    await page.getByText("Test Item").click();
    await expect(page.getByText("x1")).toBeVisible();

    // Increase
    await page.getByLabel("Increase amount").click();
    await page.waitForTimeout(200);
    await expect(page.getByText("x2")).toBeVisible();

    // Decrease
    await page.getByLabel("Decrease amount").click();
    await page.waitForTimeout(200);
    await expect(page.getByText("x1")).toBeVisible();
  });

  test("item edit flow: show form, edit, save", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", description: "Test Desc", amount: 3 });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click item, then edit
    await page.getByText("Test Item").click();
    await page.getByLabel("Edit").click();

    // Form should be visible with edit testid
    await page.waitForSelector('[data-testid="edit-form-edit"]');
    await expect(page.locator("h1").filter({ hasText: "Edit Item" })).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toHaveValue("Test Item");
    await expect(page.locator("textarea").first()).toHaveValue("Test Desc");
    await expect(page.locator('input[type="number"]').first()).toHaveValue("3");

    // Save
    await page.locator('input[type="text"]').first().fill("Updated Item");
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for form to slide out and list to reappear
    await page.waitForSelector('[data-testid="plan-items-container"] > div.translate-x-0');
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
    await expect(page.getByText("Updated Item")).toBeVisible();
  });

  test("item add flow: show form, add, cancel", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click Add new button
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');
    await expect(page.locator("h1").filter({ hasText: "Add Item" })).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toHaveValue("");

    // Fill and save
    await page.locator('input[type="text"]').first().fill("New Item");
    await page.locator("textarea").first().fill("New Description");
    await page.locator('input[type="number"]').first().fill("5");
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for form to slide out and list to reappear
    await page.waitForSelector('[data-testid="plan-items-container"] > div.translate-x-0');
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
    await expect(page.getByText("New Item")).toBeVisible();
    await expect(page.getByText("New Description")).toBeVisible();
    await expect(page.getByText("x5")).toBeVisible();

    // Test cancel
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');
    await page.locator('input[type="text"]').first().fill("Canceled Item");
    await page.getByRole("button", { name: "Cancel" }).click();

    // Wait for form to slide out
    await page.waitForSelector('[data-testid="plan-items-container"] > div.translate-x-0');
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    await expect(page.getByText("Canceled Item")).not.toBeVisible();
  });

  test("item trash requires double-click confirmation", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Item to Remove" });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click item to show buttons
    await page.getByText("Item to Remove").click();

    // First click - should show checkmark with animate-bounce
    await page.locator('[data-testid="item-remove-btn"]').click({ force: true });
    await expect(page.locator('[data-testid="item-remove-btn"]')).toHaveClass(/animate-bounce/);

    // Second click - confirms deletion
    await page.locator('[data-testid="item-remove-btn"]').click({ force: true });
    await page.waitForSelector('text="Item to Remove"', { state: "detached", timeout: 5000 });
  });

  test("remove all requires double-click confirmation", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Item 1" });
    await createTestItem(list.id, { name: "Item 2" });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // First click - should show checkmark with animate-bounce
    await page.locator('[data-testid="remove-all-btn"]').click({ force: true });
    await expect(page.locator('[data-testid="remove-all-btn"]')).toHaveClass(/animate-bounce/);

    // Second click - confirms deletion
    await page.locator('[data-testid="remove-all-btn"]').click({ force: true });
    await page.waitForSelector('text="No items yet"', { timeout: 5000 });
  });

  test("admin list trash requires double-click confirmation", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');

    const listName = `__E2E_LIST_${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(listName);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.getByText(listName)).toBeVisible();

    // First click - should show checkmark with animate-bounce
    await page.locator("li").filter({ hasText: listName }).first().locator('[data-testid="admin-delete-btn"]').click({ force: true });
    await expect(page.locator("li").filter({ hasText: listName }).first().locator('[data-testid="admin-delete-btn"]')).toHaveClass(/animate-bounce/);

    // Second click - confirms deletion
    await page.locator("li").filter({ hasText: listName }).first().locator('[data-testid="admin-delete-btn"]').click({ force: true });
    await page.waitForSelector(`text="${listName}"`, { state: "detached", timeout: 5000 });
  });

  test("list items view fades in on load", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item" });

    await page.goto(`/plan/${list.id}`);
    const fadeDiv = page.locator('[data-testid="plan-items-container"] div.transition-opacity');
    await expect(fadeDiv).toBeVisible();
    await expect(fadeDiv).toHaveClass(/transition-opacity/);
    await expect(fadeDiv).toHaveClass(/opacity-100/);
  });

  test("plan lists view fades in on load", async ({ page }) => {
    await createTestList("Test List");

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');
    const listsContainer = page.locator('[data-testid="plan-lists"] > div');
    await expect(listsContainer).toBeVisible();
    await expect(listsContainer).toHaveClass(/transition-opacity/);
  });

  test("add item slides form in from right", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click Add new
    await page.getByRole("button", { name: "Add new" }).click();

    // Both list and form should be in DOM
    await page.waitForSelector('[data-testid="plan-items-container"]');
    await page.waitForSelector('[data-testid="edit-form-add"]');

    // Form should be visible (not off-screen)
    await expect(page.locator('[data-testid="edit-form-add"]')).toBeVisible();
  });

  test("edit item slides form in from right", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Edit Me" });

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click item to show buttons, then edit
    await page.getByText("Edit Me").click();
    await page.getByLabel("Edit").click();

    // Form should be visible with edit testid
    await page.waitForSelector('[data-testid="edit-form-edit"]');
    await expect(page.locator('[data-testid="edit-form-edit"]')).toBeVisible();
  });

  test("cancel form slides out to right", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click Add new
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');

    // Click Cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Wait for form to slide out
    await page.waitForSelector('[data-testid="plan-items-container"] > div.translate-x-0');
    await expect(page.locator("h1").filter({ hasText: "Test List" })).toBeVisible();
  });

  test("back button returns to lists view from list items", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto(`/plan/${list.id}`);
    await page.waitForSelector('[data-testid="plan-items-container"]');

    // Click Back button
    const listView = page
      .locator('[data-testid="plan-items-container"] > div.translate-x-0')
      .first();
    await listView.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });

  test("back button returns to lists view from admin", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });
});
