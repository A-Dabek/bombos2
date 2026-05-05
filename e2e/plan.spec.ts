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

  test("Creating new lists and ordering them", async ({ page }) => {
    // 1. Land and check empty state
    await page.goto("/plan/lists");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(500); // Hydration safety
    await expect(page.getByText("No lists yet")).toBeVisible();

    // 2. Go to Admin
    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(500);

    // 3. Add lists
    const list1 = "Groceries";
    const list2 = "Todo";
    
    await page.getByPlaceholder("New list title...").fill(list1);
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith("/api/plan/lists") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Add List" }).click({ force: true }),
    ]);
    await expect(page.locator("li").filter({ hasText: list1 })).toBeVisible();

    await page.getByPlaceholder("New list title...").fill(list2);
    await Promise.all([
      page.waitForResponse(r => r.url().endsWith("/api/plan/lists") && r.request().method() === "POST"),
      page.getByRole("button", { name: "Add List" }).click({ force: true }),
    ]);
    await expect(page.locator("li").filter({ hasText: list2 })).toBeVisible();

    // 4. Reorder - move Todo (second) up
    const todoItemAdmin = page.locator("li").filter({ hasText: list2 }).first();
    await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/plan/lists/") && r.request().method() === "PATCH"),
      todoItemAdmin.getByLabel("Move up").click({ force: true }),
    ]);
    await page.waitForTimeout(500);
    
    // 5. Verify order in Admin
    await expect(page.locator("li").first()).toContainText(list2);
    await expect(page.locator("li").nth(1)).toContainText(list1);

    // 6. Verify order in Lists page
    await page.getByRole("link", { name: "Back" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await expect(page.locator("li").first()).toContainText(list2);
    await expect(page.locator("li").nth(1)).toContainText(list1);

    // 7. Delete list in Admin
    await page.getByRole("link", { name: "Admin" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    
    const groceriesItemAdmin = page.locator("li").filter({ hasText: list1 }).first();
    await groceriesItemAdmin.getByTestId("admin-delete-btn").click({ force: true });
    await expect(groceriesItemAdmin.getByTestId("admin-delete-btn")).toHaveClass(/animate-bounce/);
    
    await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/plan/lists/") && r.request().method() === "DELETE"),
      groceriesItemAdmin.getByTestId("admin-delete-btn").click({ force: true }),
    ]);
    await page.waitForTimeout(500);
    await expect(page.getByText(list1)).not.toBeVisible();

    // 8. Verify: Gone from Lists page
    await page.getByRole("link", { name: "Back" }).click();
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await expect(page.getByText(list2)).toBeVisible();
    await expect(page.getByText(list1)).not.toBeVisible();
  });

  test("Creating new items under a list", async ({ page }) => {
    // 1. Seed
    seedList("Shopping");

    // 2. Land
    await page.goto("/plan/lists");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(500);

    // 3. Expand list
    await page.getByRole("button", { name: "Shopping" }).click();
    await expect(page.getByRole("button", { name: "Add new" })).toBeVisible();
    
    // 4. Form cancel check
    await page.getByRole("button", { name: "Add new" }).click();
    await expect(page.getByTestId("edit-form-add")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByTestId("edit-form-add")).not.toBeVisible();

    // 5. Add item
    await page.getByRole("button", { name: "Add new" }).click({ force: true });
    await expect(page.getByTestId("edit-form-add")).toBeVisible();
    
    await page.locator('input[type="text"]').fill("Milk");
    await page.locator('input[type="number"]').fill("2");
    await Promise.all([
      page.waitForResponse(r => r.url().match(/\/api\/plan\/lists\/\d+$/) && r.request().method() === "POST"),
      page.getByRole("button", { name: "Save" }).click({ force: true }),
    ]);
    
    // 6. Verify item appears
    await expect(page.getByTestId("edit-form-add")).not.toBeVisible();
    await expect(page.getByText("Milk")).toBeVisible();
    await expect(page.getByText("x2")).toBeVisible();
  });

  test("Modifying and deleting items under a list", async ({ page }) => {
    // 1. Seed list and initial item
    seedList("Shopping");
    await page.goto("/plan/lists");
    await page.getByTestId("loader").waitFor({ state: "hidden" });
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Shopping" }).click();
    
    await page.getByRole("button", { name: "Add new" }).click({ force: true });
    await page.locator('input[type="text"]').fill("Milk");
    await page.locator('input[type="number"]').fill("2");
    await Promise.all([
      page.waitForResponse(r => r.url().match(/\/api\/plan\/lists\/\d+$/) && r.request().method() === "POST"),
      page.getByRole("button", { name: "Save" }).click({ force: true }),
    ]);

    // 2. Selection and UI state toggle
    await page.locator("li.cursor-pointer").filter({ hasText: "Milk" }).click();
    await expect(page.getByLabel("Edit")).toBeVisible();
    
    await page.locator("li.cursor-pointer").filter({ hasText: "Milk" }).click();
    await expect(page.getByLabel("Edit")).not.toBeVisible();
    
    await page.locator("li.cursor-pointer").filter({ hasText: "Milk" }).click();
    await expect(page.getByLabel("Edit")).toBeVisible();

    // 3. Change amount via buttons
    await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/plan/items/") && r.request().method() === "PATCH"),
      page.getByLabel("Increase amount").click({ force: true }),
    ]);
    await expect(page.getByText("x3")).toBeVisible();
    
    await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/plan/items/") && r.request().method() === "PATCH"),
      page.getByLabel("Decrease amount").click({ force: true }),
    ]);
    await expect(page.getByText("x2")).toBeVisible();

    // 4. Edit item via form
    await page.getByLabel("Edit").click({ force: true });
    await expect(page.getByTestId("edit-form-edit")).toBeVisible();
    await page.locator('input[type="text"]').fill("Whole Milk");
    await page.locator('textarea').fill("From local farm");
    await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/plan/items/") && r.request().method() === "PATCH"),
      page.getByRole("button", { name: "Save" }).click({ force: true }),
    ]);
    
    await expect(page.getByText("Whole Milk")).toBeVisible();
    await expect(page.getByText("From local farm")).toBeVisible();

    // 5. Delete item
    await page.locator("li.cursor-pointer").filter({ hasText: "Whole Milk" }).click({ force: true }); // Ensure active
    await page.getByTestId("item-remove-btn").click({ force: true });
    await expect(page.getByTestId("item-remove-btn")).toHaveClass(/animate-bounce/);
    
    await Promise.all([
      page.waitForResponse(r => r.url().includes("/api/plan/items/") && r.request().method() === "DELETE"),
      page.getByTestId("item-remove-btn").click({ force: true }),
    ]);
    await expect(page.getByText("Whole Milk")).not.toBeVisible();

    // 6. Remove all items
    await page.getByRole("button", { name: "Add new" }).click({ force: true });
    await page.locator('input[type="text"]').fill("Bread");
    await Promise.all([
      page.waitForResponse(r => r.url().match(/\/api\/plan\/lists\/\d+$/) && r.request().method() === "POST"),
      page.getByRole("button", { name: "Save" }).click({ force: true }),
    ]);

    await page.getByTestId("remove-all-btn").click({ force: true });
    await expect(page.getByTestId("remove-all-btn")).toHaveClass(/animate-bounce/);
    
    await Promise.all([
      page.waitForResponse(r => r.url().match(/\/api\/plan\/lists\/\d+\/items$/) && r.request().method() === "DELETE"),
      page.getByTestId("remove-all-btn").click({ force: true }),
    ]);
    await expect(page.getByText("No items yet")).toBeVisible();
  });
});
