import { test, expect, type Page } from "@playwright/test";
import { clearGroceries } from "./setup";

const FIXTURE = "e2e/fixtures/test-parcel.png";

async function openReview(page: Page) {
  await page.getByTestId("import-recipe-btn").click();
  await expect(page).toHaveURL(/\/groceries\/import/);
  await page.getByTestId("import-file-input").setInputFiles(FIXTURE);
  await expect(page.getByTestId("import-row-0")).toBeVisible({ timeout: 10000 });
}

test.describe("Groceries recipe import @groceries", () => {
  test.beforeEach(async ({ page }) => {
    clearGroceries();
    await page.goto("/groceries/planning");
  });

  test("import screenshot -> review -> confirm -> items on planning", async ({ page }) => {
    await openReview(page);

    // Stub returns 5 items, each with original raw text and a match badge.
    await expect(page.getByTestId("import-row-4")).toBeVisible();
    await expect(page.getByTestId("import-name-0")).toHaveValue("cebula");
    await expect(page.getByTestId("import-raw-0")).toBeVisible();
    await expect(page.getByTestId("import-match-0")).toHaveText("Nowe");

    // Edit name + unit, delete the last row.
    await page.getByTestId("import-name-0").fill("cebula e2e");
    await page.getByTestId("import-unit-0").selectOption("kg");
    await page.getByTestId("import-delete-4").click();
    await expect(page.getByTestId("import-row-4")).not.toBeVisible();

    // Confirm -> POST then redirect to planning.
    const confirmResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/groceries/import/confirm") &&
        response.request().method() === "POST",
    );
    await page.getByTestId("import-confirm-btn").click();
    expect((await confirmResponse).status()).toBe(201);

    await expect(page).toHaveURL(/\/groceries\/planning/);
    await expect(page.getByText("cebula e2e", { exact: true })).toBeVisible();
    await expect(page.getByText("sól", { exact: true })).not.toBeVisible();
  });

  test("back button returns to the upload step", async ({ page }) => {
    await openReview(page);

    await page.getByTestId("import-back-btn").click();
    await expect(page.getByRole("heading", { name: "Import ze zdjęcia" })).toBeVisible();
    await expect(page.getByTestId("import-row-0")).not.toBeVisible();
    await expect(page).toHaveURL(/\/groceries\/import/);
  });

  test("confirm blocks on empty names with a validation message", async ({ page }) => {
    await openReview(page);

    await page.getByTestId("import-name-0").fill("");
    await page.getByTestId("import-confirm-btn").click();

    await expect(page.getByTestId("import-review-error")).toBeVisible();
    await expect(page).toHaveURL(/\/groceries\/import/);
  });
});
