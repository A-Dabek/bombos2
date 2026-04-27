import { test, expect } from "@playwright/test";

test.describe("plan", () => {
  test("redirects /plan to /plan/lists", async ({ page }) => {
    await page.goto("/plan");
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });

  test("main lists view displays all lists", async ({ page }) => {
    await page.goto("/plan/lists");
    await expect(page.getByRole("heading", { name: "Plan" })).toBeVisible();
  });

  test("shows no lists yet when empty", async ({ page }) => {
    await page.goto("/plan/lists");
    await page.waitForTimeout(500);
    await expect(page.getByText("No lists yet")).toBeVisible();
  });

  test("admin button is visible on main view", async ({ page }) => {
    await page.goto("/plan/lists");
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  });

  test("admin page navigation works", async ({ page }) => {
    await page.goto("/plan/lists");
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/plan\/admin\/?$/);
    // Back button should exist
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
  });

  test("admin can add a new list", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForTimeout(500);
    const testListName = `__E2E_TEST_LIST__${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(testListName);
    await page.getByRole("button", { name: "Add List" }).click();
    // Should appear in the list
    await expect(page.getByText(testListName)).toBeVisible();
  });

  test("admin can reorder lists with up/down buttons", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForTimeout(500);
    // Add two lists
    const list1 = `__E2E_LIST_1__${Date.now()}`;
    const list2 = `__E2E_LIST_2__${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(list1);
    await page.getByRole("button", { name: "Add List" }).click();
    await page.getByPlaceholder("New list title...").fill(list2);
    await page.getByRole("button", { name: "Add List" }).click();
    await page.waitForTimeout(500);
    // Verify list1 is first, list2 is second
    const items = page.locator("li");
    await expect(items.first()).toContainText(list1);
    await expect(items.nth(1)).toContainText(list2);
    // Click move down on list1
    const firstItem = page.locator("li").filter({ hasText: list1 }).first();
    await firstItem.getByLabel("Move down").click();
    await page.waitForTimeout(500);
    // Now list2 should be first, list1 should be second
    await expect(items.first()).toContainText(list2);
    await expect(items.nth(1)).toContainText(list1);
    // Navigate to normal view and verify order persists
    await page.goto("/plan/lists");
    await page.waitForTimeout(500);
    const normalItems = page.locator("li");
    await expect(normalItems.first()).toContainText(list2);
    await expect(normalItems.nth(1)).toContainText(list1);
    // Go back to admin and verify order still persists
    await page.goto("/plan/admin");
    await page.waitForTimeout(500);
    const adminItems = page.locator("li");
    await expect(adminItems.first()).toContainText(list2);
    await expect(adminItems.nth(1)).toContainText(list1);
  });

  test("admin can delete a list", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForTimeout(500);
    // Add a list to delete
    const testListName = `__E2E_DELETE_LIST__${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(testListName);
    await page.getByRole("button", { name: "Add List" }).click();
    await expect(page.getByText(testListName)).toBeVisible();
    // Delete the list
    const listItem = page.locator("li").filter({ hasText: testListName }).first();
    await listItem.getByLabel("Delete").click();
    // Should be removed
    await expect(page.getByText(testListName)).not.toBeVisible();
  });

  test("clicking a list navigates to list items view", async ({ page }) => {
    // First create a list in admin
    await page.goto("/plan/admin");
    await page.waitForTimeout(500);
    const testListName = `__E2E_NAV_LIST__${Date.now()}`;
    await page.getByPlaceholder("New list title...").fill(testListName);
    await page.getByRole("button", { name: "Add List" }).click();
    await page.waitForTimeout(500);

    // Go to lists view and click the list
    await page.goto("/plan/lists");
    await page.getByText(testListName).click();
    await expect(page).toHaveURL(/\/plan\/\d+\/?$/);
  });

  test("list items view shows items correctly", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    // Create an item
    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item", description: "Test Description", amount: 2 }),
    });

    // Navigate to list
    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Should show list title
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    // Should show item
    await expect(page.getByText("Test Item")).toBeVisible();
    // Should show description
    await expect(page.getByText("Test Description")).toBeVisible();
    // Should show amount
    await expect(page.getByText("x2")).toBeVisible();
  });

  test("clicking an item shows edit/remove/amount buttons", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item" }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click the item
    await page.getByText("Test Item").click();
    // Buttons should be visible
    await expect(page.getByLabel("Decrease amount")).toBeVisible();
    await expect(page.getByLabel("Increase amount")).toBeVisible();
    await expect(page.getByLabel("Edit")).toBeVisible();
    await expect(page.getByLabel("Remove")).toBeVisible();
  });

  test("clicking the same item again hides the buttons", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item" }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click the item to show buttons
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Edit")).toBeVisible();

    // Click again to hide
    await page.getByText("Test Item").click();
    await expect(page.getByLabel("Edit")).not.toBeVisible();
  });

  test("plus/minus buttons change item amount", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item", amount: 1 }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Show buttons
    await page.getByText("Test Item").click();
    await expect(page.getByText("x1")).toBeVisible();

    // Click plus
    await page.getByLabel("Increase amount").click();
    await page.waitForTimeout(300);
    await expect(page.getByText("x2")).toBeVisible();

    // Click minus
    await page.getByLabel("Decrease amount").click();
    await page.waitForTimeout(300);
    await expect(page.getByText("x1")).toBeVisible();
  });

  test("edit button shows form with item data", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item", description: "Test Desc", amount: 3 }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click item, then edit
    await page.getByText("Test Item").click();
    await page.getByLabel("Edit").click();

    // Form should be visible with data
    await expect(page.getByRole("heading", { name: "Edit Item" })).toBeVisible();
    await expect(page.getByDisplayValue("Test Item")).toBeVisible();
    await expect(page.getByDisplayValue("Test Desc")).toBeVisible();
    await expect(page.getByDisplayValue("3")).toBeVisible();
  });

  test("save in edit form updates the item and returns to list", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item" }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click item, then edit
    await page.getByText("Test Item").click();
    await page.getByLabel("Edit").click();

    // Change name and save
    await page.getByLabel("Name").fill("Updated Item");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(300);

    // Should return to list view with updated item
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    await expect(page.getByText("Updated Item")).toBeVisible();
  });

  test("cancel in edit form returns to list without saving", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Item" }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click item, then edit
    await page.getByText("Test Item").click();
    await page.getByLabel("Edit").click();

    // Change name and cancel
    await page.getByLabel("Name").fill("Updated Item");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);

    // Should return to list view with original item
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    await expect(page.getByText("Test Item")).toBeVisible();
    await expect(page.getByText("Updated Item")).not.toBeVisible();
  });

  test("add new button shows empty form", async ({ page }) => {
    // Create a list via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click Add new button
    await page.getByRole("button", { name: "Add new" }).click();

    // Form should be visible
    await expect(page.getByRole("heading", { name: "Add Item" })).toBeVisible();
    // Fields should be empty
    const nameInput = page.getByLabel("Name");
    await expect(nameInput).toHaveValue("");
  });

  test("save in add form creates item and returns to list", async ({ page }) => {
    // Create a list via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click Add new button
    await page.getByRole("button", { name: "Add new" }).click();

    // Fill form
    await page.getByLabel("Name").fill("New Item");
    await page.getByLabel("Description").fill("New Description");
    await page.getByLabel("Amount").fill("5");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(300);

    // Should return to list view with new item
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    await expect(page.getByText("New Item")).toBeVisible();
    await expect(page.getByText("New Description")).toBeVisible();
    await expect(page.getByText("x5")).toBeVisible();
  });

  test("cancel in add form returns to list", async ({ page }) => {
    // Create a list via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click Add new button
    await page.getByRole("button", { name: "Add new" }).click();

    // Fill form and cancel
    await page.getByLabel("Name").fill("New Item");
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);

    // Should return to list view without new item
    await expect(page.getByRole("heading", { name: "Test List" })).toBeVisible();
    await expect(page.getByText("New Item")).not.toBeVisible();
  });

  test("remove button deletes item immediately", async ({ page }) => {
    // Create a list and item via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Item to Remove" }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click item, then remove
    await page.getByText("Item to Remove").click();
    await page.getByLabel("Remove").click();
    await page.waitForTimeout(300);

    // Item should be gone
    await expect(page.getByText("Item to Remove")).not.toBeVisible();
  });

  test("remove all button deletes all items immediately", async ({ page }) => {
    // Create a list and items via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Item 1" }),
    });
    await fetch(`http://localhost:5173/api/plan/lists/${listId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Item 2" }),
    });

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click Remove all button
    await page.getByRole("button", { name: "Remove all" }).click();
    await page.waitForTimeout(300);

    // Should show no items message
    await expect(page.getByText("No items yet")).toBeVisible();
  });

  test("back button returns to lists view from list items", async ({ page }) => {
    // Create a list via API
    const createListRes = await fetch("http://localhost:5173/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test List", display_order: 0 }),
    });
    const listData = await createListRes.json();
    const listId = listData.id;

    await page.goto(`/plan/${listId}`);
    await page.waitForTimeout(500);

    // Click Back button
    await page.getByRole("link", { name: "Back" }).click();

    // Should be at lists view
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });

  test("back button returns to lists view from admin", async ({ page }) => {
    await page.goto("/plan/admin");
    await page.waitForTimeout(500);

    // Click Back button
    await page.getByRole("link", { name: "Back" }).click();

    // Should be at lists view
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);
  });
});