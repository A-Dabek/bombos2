import { test, expect } from "@playwright/test";
import { clearPlan } from "./setup";
import Database from "better-sqlite3";

const DB_PATH = "./data/app.db";

function seedList(title: string) {
  const db = new Database(DB_PATH);
  const result = db.prepare("INSERT INTO plan_lists (title, display_order, created_at) VALUES (?, ?, ?)").run(title, 0, Date.now());
  db.close();
  return result.lastInsertRowid;
}

test.describe("plan", () => {
  test.beforeEach(async () => {
    clearPlan();
  });

  test("Plan Navigation and Redirects", async ({ page }) => {
    // Land on /plan and check redirect
    await page.goto("/plan");
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);

    // Check empty state
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await expect(page.getByText("No lists yet")).toBeVisible();

    // Check old item route redirect
    const listId = seedList("Redirect Test");
    await page.goto(`/plan/${listId}`);
    await expect(page).toHaveURL(/\/plan\/lists\/?$/);

    // Check admin navigation
    await page.getByRole("link", { name: "Admin" }).click();
    await expect(page).toHaveURL(/\/plan\/admin\/?$/);
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible();
  });

  test("Journey: List Management", async ({ page }) => {
    // 1. Land
    await page.goto("/plan/lists");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    // 2. Interact: Go to Admin
    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    // 3. Modify: Add lists
    const list1 = "Groceries";
    const list2 = "Todo";
    
    const addPromise1 = page.waitForResponse(r => r.url().includes("/api/plan/lists") && r.request().method() === "POST");
    await page.getByPlaceholder("New list title...").fill(list1);
    await page.getByRole("button", { name: "Add List" }).click({ force: true });
    await addPromise1;
    await expect(page.locator("li").filter({ hasText: list1 })).toBeVisible();

    const addPromise2 = page.waitForResponse(r => r.url().includes("/api/plan/lists") && r.request().method() === "POST");
    await page.getByPlaceholder("New list title...").fill(list2);
    await page.getByRole("button", { name: "Add List" }).click({ force: true });
    await addPromise2;
    await expect(page.locator("li").filter({ hasText: list2 })).toBeVisible();

    // 4. Modify: Reorder - move Todo (second) up
    const todoItemAdmin = page.locator("li").filter({ hasText: list2 }).first();
    const movePromise = page.waitForResponse(r => r.request().method() === "PATCH", { timeout: 10000 }).catch(() => null);
    await todoItemAdmin.getByLabel("Move up").click({ force: true });
    await movePromise;
    // Wait a bit for state update if movePromise timed out
    await page.waitForTimeout(500);
    
    // 5. Verify: Check order in Admin
    await expect(page.locator("li").first()).toContainText(list2);
    await expect(page.locator("li").nth(1)).toContainText(list1);

    // 6. Verify: Check order in Lists page
    await page.getByRole("link", { name: "Back" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await expect(page.locator("li").first()).toContainText(list2);
    await expect(page.locator("li").nth(1)).toContainText(list1);

    // 7. Modify: Delete list in Admin
    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    
    const groceriesItemAdmin = page.locator("li").filter({ hasText: list1 }).first();
    await groceriesItemAdmin.getByTestId("admin-delete-btn").click({ force: true });
    await expect(groceriesItemAdmin.getByTestId("admin-delete-btn")).toHaveClass(/animate-bounce/);
    
    const deletePromise = page.waitForResponse(r => r.request().method() === "DELETE", { timeout: 10000 }).catch(() => null);
    await groceriesItemAdmin.getByTestId("admin-delete-btn").click({ force: true });
    await deletePromise;
    await page.waitForTimeout(500);
    await expect(page.getByText(list1)).not.toBeVisible();

    // 8. Verify: Gone from Lists page
    await page.getByRole("link", { name: "Back" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await expect(page.getByText(list2)).toBeVisible();
    await expect(page.getByText(list1)).not.toBeVisible();
  });

  test("Journey: Item Operations", async ({ page }) => {
    // 1. Seed
    seedList("Shopping");

    // 2. Land
    await page.goto("/plan/lists");
    await page.getByTestId("loader").waitFor({ state: "hidden" });

    // 3. Interact: Expand list
    await page.getByRole("button", { name: "Shopping" }).click();
    // Wait for expansion and items loader if any
    await expect(page.getByRole("button", { name: "Add new" })).toBeVisible();
    
    // 4. Modify: Add item
    const addPromise = page.waitForResponse(r => r.request().method() === "POST");
    await page.getByRole("button", { name: "Add new" }).click({ force: true });
    await expect(page.getByTestId("edit-form-add")).toBeVisible();
    
    await page.locator('input[type="text"]').fill("Milk");
    await page.locator('input[type="number"]').fill("2");
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    await addPromise;
    
    // Wait for form to close and item to appear
    await expect(page.getByTestId("edit-form-add")).not.toBeVisible();
    await expect(page.getByText("Milk")).toBeVisible();
    await expect(page.getByText("x2")).toBeVisible();

    // 5. Interact: Change amount via buttons
    await page.locator("li.cursor-pointer").filter({ hasText: "Milk" }).click({ force: true }); // Activate item
    const incPromise = page.waitForResponse(r => r.url().includes("/api/plan/items") && r.request().method() === "PATCH");
    await page.getByLabel("Increase amount").click({ force: true });
    await incPromise;
    await expect(page.getByText("x3")).toBeVisible();
    
    const decPromise = page.waitForResponse(r => r.url().includes("/api/plan/items") && r.request().method() === "PATCH");
    await page.getByLabel("Decrease amount").click({ force: true });
    await decPromise;
    await expect(page.getByText("x2")).toBeVisible();

    // 6. Modify: Edit item via form
    const editPromise = page.waitForResponse(r => r.url().includes("/api/plan/items") && r.request().method() === "PATCH");
    await page.getByLabel("Edit").click({ force: true });
    await expect(page.getByTestId("edit-form-edit")).toBeVisible();
    await page.locator('input[type="text"]').fill("Whole Milk");
    await page.locator('textarea').fill("From local farm");
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    await editPromise;
    
    await expect(page.getByText("Whole Milk")).toBeVisible();
    await expect(page.getByText("From local farm")).toBeVisible();

    // 7. Modify: Delete item
    await page.locator("li.cursor-pointer").filter({ hasText: "Whole Milk" }).click({ force: true }); // Ensure active
    await page.getByTestId("item-remove-btn").click({ force: true });
    await expect(page.getByTestId("item-remove-btn")).toHaveClass(/animate-bounce/);
    
    const itemDeletePromise = page.waitForResponse(r => r.url().includes("/api/plan/items") && r.request().method() === "DELETE");
    await page.getByTestId("item-remove-btn").click({ force: true });
    await itemDeletePromise;
    await expect(page.getByText("Whole Milk")).not.toBeVisible();

    // 8. Modify: Remove all items
    const addAgainPromise = page.waitForResponse(r => r.request().method() === "POST");
    await page.getByRole("button", { name: "Add new" }).click({ force: true });
    await page.locator('input[type="text"]').fill("Bread");
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    await addAgainPromise;
    await expect(page.getByText("Bread")).toBeVisible();

    await page.getByTestId("remove-all-btn").click({ force: true });
    await expect(page.getByTestId("remove-all-btn")).toHaveClass(/animate-bounce/);
    
    const removeAllPromise = page.waitForResponse(r => r.request().method() === "DELETE");
    await page.getByTestId("remove-all-btn").click({ force: true });
    await removeAllPromise;
    await expect(page.getByText("No items yet")).toBeVisible();
  });

  test("Item Selection and UI States", async ({ page }) => {
    seedList("UI Test");
    
    await page.goto("/plan/lists");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "UI Test" }).click();
    
    // Add item
    await page.getByRole("button", { name: "Add new" }).click({ force: true });
    await page.locator('input[type="text"]').fill("Selectable Item");
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    
    // Toggle selection
    await page.locator("li.cursor-pointer").filter({ hasText: "Selectable Item" }).click();
    await expect(page.getByLabel("Edit")).toBeVisible();
    
    await page.locator("li.cursor-pointer").filter({ hasText: "Selectable Item" }).click();
    await expect(page.getByLabel("Edit")).not.toBeVisible();
    
    // Form cancel
    await page.getByRole("button", { name: "Add new" }).click();
    await expect(page.getByTestId("edit-form-add")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("edit-form-add")).not.toBeVisible();
  });
});
