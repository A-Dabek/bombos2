import { test, expect } from "@playwright/test";
import { clearGroceries } from "./setup";

test.describe("Groceries Form Feedback", () => {
  test.beforeEach(async ({ page }) => {
    clearGroceries();
    await page.goto("/groceries/planning");
  });

  test("shows feedback after clicking Next", async ({ page }) => {
    await page.getByTestId("add-item-btn").click();
    
    // No feedback initially
    await expect(page.getByTestId("form-feedback")).not.toBeVisible();

    // Add first item via Next
    await page.getByLabel("Nazwa *").fill("Milk");
    await page.getByTestId("form-next-btn").click();

    // Feedback should be visible
    await expect(page.getByTestId("form-feedback")).toBeVisible();
    await expect(page.getByTestId("form-feedback")).toContainText("Poprzednio dodano: Milk");

    // Add second item via Next
    await page.getByLabel("Nazwa *").fill("Bread");
    await page.getByTestId("form-next-btn").click();

    // Feedback should update
    await expect(page.getByTestId("form-feedback")).toContainText("Poprzednio dodano: Bread");

    // Close and reopen form - feedback should be gone (it's internal to GroceryForm component state)
    await page.getByTestId("form-cancel-btn").click();
    await page.getByTestId("add-item-btn").click();
    await expect(page.getByTestId("form-feedback")).not.toBeVisible();
  });
});
