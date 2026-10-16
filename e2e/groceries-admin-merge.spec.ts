import { test, expect, type Page } from "@playwright/test";
import {
  clearGroceries,
  clearGroceryCatalog,
  seedProductCount,
  seedIngredientAlias,
} from "./setup";

const TARGET = "Pierś z kurczaka";
const SOURCE_A = "Filet z piersi kurczaka";
const SOURCE_B = "Kurczak pierś";

async function addItem(page: Page, name: string) {
  await page.getByTestId("add-item-btn").click();
  await page.getByLabel("Nazwa *").fill(name);
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/groceries" &&
      response.request().method() === "POST",
  );
  await page.getByTestId("form-save-btn").click();
  await responsePromise;
}

test.describe("Groceries admin product merge @groceries", () => {
  test.beforeEach(() => {
    clearGroceries();
    clearGroceryCatalog();
  });

  test("merge duplicates through the admin UI", async ({ page }) => {
    seedProductCount(TARGET, 5);
    seedProductCount(SOURCE_A, 2);
    seedProductCount(SOURCE_B, 1);

    await page.goto("/groceries/planning");
    await addItem(page, SOURCE_A);

    await page.getByTestId("admin-button").click();
    await expect(page).toHaveURL(/\/groceries\/admin/);
    await expect(page.getByTestId("groceries-admin")).toBeVisible();

    const resultRow = (name: string) =>
      page.locator(
        `[data-testid="admin-merge-result-row"][data-name="${name}"]`,
      );
    const stagedRow = (name: string) =>
      page.locator(
        `[data-testid="admin-merge-staged-row"][data-name="${name}"]`,
      );

    await resultRow(TARGET).click();
    await resultRow(SOURCE_A).click();
    await resultRow(SOURCE_B).click();

    await expect(stagedRow(TARGET)).toBeVisible();
    await expect(stagedRow(SOURCE_A)).toBeVisible();
    await expect(stagedRow(SOURCE_B)).toBeVisible();
    await expect(
      stagedRow(TARGET).getByTestId("admin-merge-target-badge"),
    ).toBeVisible();

    const submit = page.getByTestId("admin-merge-submit");
    const mergeResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/api/groceries/admin" &&
        response.request().method() === "POST",
    );
    await submit.click();
    await expect(submit).toHaveText("Potwierdź scalenie");
    await submit.click();
    expect((await mergeResponse).status()).toBe(201);

    await expect(page.getByTestId("admin-merge-success")).toBeVisible();

    await page.goto("/groceries/planning");
    await expect(page.getByText(TARGET, { exact: true })).toBeVisible();

    const suggestions = await (
      await page.request.get("/api/groceries/suggestions")
    ).json();
    const chicken = suggestions.filter(
      (s: { name: string }) => s.name === TARGET,
    );
    expect(chicken).toHaveLength(1);
    expect(chicken[0].buy_count).toBe(8);
  });

  test("manual add canonicalizes known aliases", async ({ page }) => {
    seedProductCount("onion", 3);
    seedIngredientAlias("onions", "onion");

    await page.goto("/groceries/planning");
    await addItem(page, "onions");

    await expect(page.getByText("onion", { exact: true })).toBeVisible();
  });
});
