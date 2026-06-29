import { test, expect } from "@playwright/test";
import { clearGroceries } from "./setup";

test.describe("Groceries Planning Layout", () => {
  test.beforeEach(async ({ page }) => {
    clearGroceries();
    await page.goto("/groceries/planning");
  });

  test("remove buttons at top and mutually exclusive", async ({ page }) => {
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
    const deleteAllBtn = page.getByTestId("delete-all-btn"); // won't be visible now, let's use remove bought
    const deleteBoughtBtn = page.getByTestId("delete-bought-btn");
    const addItemBtn = page.getByTestId("add-item-btn");
    const itemRow = page.getByText("Bread");

    const deleteBoughtBox = await deleteBoughtBtn.boundingBox();
    const addItemBox = await addItemBtn.boundingBox();
    const itemBox = await itemRow.boundingBox();

    expect(deleteBoughtBox!.y).toBeLessThan(itemBox!.y);
    expect(itemBox!.y).toBeLessThan(addItemBox!.y);
  });
});
