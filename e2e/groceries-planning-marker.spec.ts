import { test, expect } from "@playwright/test";
import { clearGroceries } from "./setup";

test.describe("Groceries Planning Last Added Marker", () => {
  test.beforeEach(async ({ page }) => {
    clearGroceries();
    await page.goto("/groceries/planning");
  });

  test("shows marker for last added item", async ({ page }) => {
    // Add first item
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Milk");
    await page.getByTestId("form-save-btn").click();

    const milkItem = page.locator("li", { hasText: "Milk" });
    await expect(milkItem).toContainText("Ostatni");
    await expect(milkItem).toHaveClass(/ring-2 ring-blue-400/);

    // Add second item via 'Next' (to keep form open, though PlanningFormView might handle it differently)
    // Actually handleNext is used for 'Dodaj i kolejny' button if it exists
    await page.getByTestId("add-item-btn").click();
    await page.getByLabel("Nazwa *").fill("Bread");
    await page.getByTestId("form-next-btn").click(); // Assuming 'Dodaj i kolejny' has this testid

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
});
