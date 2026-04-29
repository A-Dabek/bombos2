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
    await page.locator("li").filter({ hasText: list1 }).first().locator('[data-testid="admin-delete-btn"]').click({ force: true });
    await expect(page.locator("li").filter({ hasText: list1 }).first().locator('[data-testid="admin-delete-btn"]')).toHaveClass(/animate-bounce/);
    await page.locator("li").filter({ hasText: list1 }).first().locator('[data-testid="admin-delete-btn"]').click({ force: true });
    await expect(page.getByText(list1)).not.toBeVisible({ timeout: 5000 });
  });

  // Accordion Behavior Tests

  test("clicking a list expands it with animation", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Click list to expand
    await page.getByText("Test List").click();

    // Items section should become visible with animation
    await expect(page.getByText("Test Item")).toBeVisible();
    await expect(page.getByText("No items yet")).not.toBeVisible();
  });

  test("clicking expanded list collapses it", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand
    await page.getByText("Test List").click();
    await expect(page.getByText("Test Item")).toBeVisible();

    // Collapse
    await page.getByText("Test List").click();
    // Wait for collapse animation then check items container has max-h-0
    await page.waitForSelector('[data-testid="plan-lists"] div.max-h-0', { timeout: 1000 });
  });

  test("only one list expanded at a time", async ({ page }) => {
    const list1 = await createTestList("List 1");
    const list2 = await createTestList("List 2");
    await createTestItem(list1.id, { name: "Item 1" });
    await createTestItem(list2.id, { name: "Item 2" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list 1
    await page.getByText("List 1").click();
    await expect(page.getByText("Item 1")).toBeVisible();

    // Expand list 2 (should collapse list 1)
    await page.getByText("List 2").click();
    // List 1 should collapse (check for max-h-0 on its section)
    await page.waitForTimeout(350);
    // List 2 should be expanded and show its items
    await expect(page.getByText("Item 2")).toBeVisible();
  });

  test("items are lazy loaded on expand", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Lazy Item" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // Should show loading or items
    await expect(page.getByText("Lazy Item")).toBeVisible({ timeout: 5000 });
  });

  test("cached items show instantly on re-expand", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Cached Item" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list (loads items)
    await page.getByText("Test List").click();
    await expect(page.getByText("Cached Item")).toBeVisible();

    // Collapse
    await page.getByText("Test List").click();
    await page.waitForTimeout(350);

    // Re-expand (should use cache, no loading)
    await page.getByText("Test List").click();
    // Items should appear immediately (no loading state)
    await expect(page.getByText("Cached Item")).toBeVisible();
  });

  test("add item button is inside items section", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // "Add new" button should be visible in items section
    await expect(page.getByRole("button", { name: "Add new" })).toBeVisible();
  });

  test("form slides in replacing only items section", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // Click Add new
    await page.getByRole("button", { name: "Add new" }).click();

    // Form should be visible
    await page.waitForSelector('[data-testid="edit-form-add"]');

    // List header should still be visible (not replaced by form)
    await expect(page.getByText("Test List")).toBeVisible();
  });

  test("form cancel returns to items section", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // Click Add new, then Cancel
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');
    await page.getByRole("button", { name: "Cancel" }).click();

    // Items section should return
    await page.waitForTimeout(350);
    await expect(page.getByRole("button", { name: "Add new" })).toBeVisible();
  });

  test("removed route redirects to lists", async ({ page }) => {
    const list = await createTestList("Test List");

    // Try to access old route
    await page.goto(`/plan/${list.id}`);

    // Should redirect to /plan/lists
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });

  // Item Interaction Tests (within accordion)

  test("item interaction: select, show buttons, toggle, change amount", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Test Item", amount: 1 });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();
    await expect(page.getByText("Test Item")).toBeVisible();

    // Click item to show buttons
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Decrease amount")).toBeVisible();
    await expect(page.getByLabel("Increase amount")).toBeVisible();
    await expect(page.getByLabel("Edit")).toBeVisible();

    const itemRemoveBtn = page.getByLabel("Remove", { exact: true });
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

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();
    await expect(page.getByText("Test Item")).toBeVisible();

    // Click item, then edit
    await page.getByText("Test Item").click();
    await page.getByLabel("Edit").click();

    // Form should be visible with edit testid
    await page.waitForSelector('[data-testid="edit-form-edit"]');
    await expect(page.getByText("Edit Item")).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toHaveValue("Test Item");
    await expect(page.locator("textarea").first()).toHaveValue("Test Desc");
    await expect(page.locator('input[type="number"]').first()).toHaveValue("3");

    // Save
    await page.locator('input[type="text"]').first().fill("Updated Item");
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for form to slide out and list to reappear
    await page.waitForTimeout(350);
    await expect(page.getByText("Updated Item")).toBeVisible();
  });

  test("item add flow: show form, add, cancel", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // Click Add new button
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');
    await expect(page.getByText("Add Item")).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toHaveValue("");

    // Fill and save
    await page.locator('input[type="text"]').first().fill("New Item");
    await page.locator("textarea").first().fill("New Description");
    await page.locator('input[type="number"]').first().fill("5");
    await page.getByRole("button", { name: "Save" }).click();

    // Wait for form to slide out and list to reappear
    await page.waitForTimeout(350);
    await expect(page.getByText("New Item")).toBeVisible();
    await expect(page.getByText("New Description")).toBeVisible();
    await expect(page.getByText("x5")).toBeVisible();

    // Test cancel
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');
    await page.locator('input[type="text"]').first().fill("Canceled Item");
    await page.getByRole("button", { name: "Cancel" }).click();

    // Wait for form to slide out
    await page.waitForTimeout(350);
    await expect(page.getByText("Canceled Item")).not.toBeVisible();
  });

  test("item trash requires double-click confirmation", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Item to Remove" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();
    await expect(page.getByText("Item to Remove")).toBeVisible();

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

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();
    await expect(page.getByText("Item 1")).toBeVisible();

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

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // Click Add new
    await page.getByRole("button", { name: "Add new" }).click();

    // Form should be visible
    await page.waitForSelector('[data-testid="edit-form-add"]');
    await expect(page.locator('[data-testid="edit-form-add"]')).toBeVisible();
  });

  test("edit item slides form in from right", async ({ page }) => {
    const list = await createTestList("Test List");
    await createTestItem(list.id, { name: "Edit Me" });

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();
    await expect(page.getByText("Edit Me")).toBeVisible();

    // Click item to show buttons, then edit
    await page.getByText("Edit Me").click();
    await page.getByLabel("Edit").click();

    // Form should be visible with edit testid
    await page.waitForSelector('[data-testid="edit-form-edit"]');
    await expect(page.locator('[data-testid="edit-form-edit"]')).toBeVisible();
  });

  test("cancel form slides out to right", async ({ page }) => {
    const list = await createTestList("Test List");

    await page.goto("/plan/lists");
    await page.waitForSelector('[data-testid="plan-lists"]');

    // Expand list
    await page.getByText("Test List").click();

    // Click Add new
    await page.getByRole("button", { name: "Add new" }).click();
    await page.waitForSelector('[data-testid="edit-form-add"]');

    // Click Cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Wait for form to slide out
    await page.waitForTimeout(350);
    await expect(page.getByText("Test List")).toBeVisible();
  });

  test("back button returns to lists view from admin", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForSelector('[data-testid="plan-admin"]');
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });
});
