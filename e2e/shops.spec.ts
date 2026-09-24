import { test, expect, type Page } from "@playwright/test";
import { clearGroceries } from "./setup";

async function exactRow(page: Page, prefix: string, name: string) {
  const row = page.locator(`[data-testid^="${prefix}"]`, { hasText: name });
  await expect(row).toBeVisible();
  const testid = await row.getAttribute("data-testid");
  return page.getByTestId(testid!);
}

async function rowId(page: Page, prefix: string, name: string): Promise<string> {
  const row = await exactRow(page, prefix, name);
  const testid = await row.getAttribute("data-testid");
  return testid!.replace(prefix, "");
}

test.describe("Shops Module @groceries", () => {
  test.beforeEach(async ({ page }) => {
    clearGroceries();
    await page.goto("/groceries/shops");
  });

  test("shows the seeded active shop", async ({ page }) => {
    const lidl = await exactRow(page, "shop-row-", "Lidl");
    await expect(lidl).toContainText("aktywny");
    await expect(lidl.getByTestId(/shop-active-/)).toBeVisible();
  });

  test("adds, renames, activates and deletes a shop", async ({ page }) => {
    const rowB = () =>
      page.locator('[data-testid^="shop-row-"]', { hasText: "Biedronka" });
    await expect(async () => {
      if (
        (await rowB().count()) === 0 &&
        (await page.getByLabel("Nowy sklep").count()) > 0
      ) {
        await page.getByLabel("Nowy sklep").fill("Biedronka");
        await page.getByTestId("add-shop-btn").click();
      }
      await expect(rowB()).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 10000 });

    const id = await rowId(page, "shop-row-", "Biedronka");

    // Open the dedicated shop screen
    await page.getByTestId(`shop-open-${id}`).click();
    await expect(page).toHaveURL(new RegExp(`/groceries/shops/${id}/?$`));

    // Rename
    await expect(async () => {
      if ((await page.getByTestId("shop-edit-input").count()) === 0) {
        await page.getByTestId("shop-rename").click();
      }
      await page.getByTestId("shop-edit-input").fill("Biedronka 2");
      await page.getByTestId("shop-save").click();
      await expect(
        page.getByRole("heading", { name: /Biedronka 2/ }),
      ).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 10000 });

    // Set active
    await expect(async () => {
      if (!(await page.getByTestId("shop-detail").textContent())?.includes("aktywny")) {
        await page.getByTestId("shop-active").click();
      }
      await expect(page.getByTestId("shop-detail")).toContainText("aktywny", {
        timeout: 1500,
      });
    }).toPass({ timeout: 10000 });

    // Delete (two clicks) and return to the list
    await page.getByTestId("shop-delete").click();
    await page.getByTestId("shop-delete").click();
    await expect(page).toHaveURL(/\/groceries\/shops\/?$/);

    const lidl = await exactRow(page, "shop-row-", "Lidl");
    await expect(lidl).toContainText("aktywny");
  });

  test("blocks deleting the last shop", async ({ page }) => {
    const id = await rowId(page, "shop-row-", "Lidl");
    await page.getByTestId(`shop-open-${id}`).click();

    await expect(page.getByTestId("shop-delete")).toBeDisabled();
    await expect(page.getByText("Nie można usunąć ostatniego sklepu.")).toBeVisible();
  });

  test("manages aisles: add, rename, reorder and delete", async ({ page }) => {
    const id = await rowId(page, "shop-row-", "Lidl");
    await page.getByTestId(`shop-open-${id}`).click();
    await expect(page.getByRole("heading", { name: "Alejki" })).toBeVisible();

    await page.getByLabel("Nowa alejka").fill("Nabiał");
    await page.getByTestId("add-aisle-btn").click();
    await exactRow(page, "aisle-row-", "Nabiał");

    await page.getByLabel("Nowa alejka").fill("Owoce");
    await page.getByTestId("add-aisle-btn").click();
    const owoce = await exactRow(page, "aisle-row-", "Owoce");

    const aisleNames = () =>
      page.locator('[data-testid^="aisle-row-"]').allTextContents();
    await expect.poll(async () => (await aisleNames()).length).toBe(2);
    expect((await aisleNames())[0]).toContain("Nabiał");
    expect((await aisleNames())[1]).toContain("Owoce");

    // Rename Owoce -> Warzywa
    await owoce.getByTestId(/aisle-rename-/).click();
    await owoce.getByTestId(/aisle-edit-input-/).fill("Warzywa");
    await owoce.getByTestId(/aisle-save-/).click();
    const warzywa = await exactRow(page, "aisle-row-", "Warzywa");

    // Move Warzywa up
    await warzywa.getByTestId(/aisle-up-/).click();
    await expect.poll(async () => (await aisleNames())[0]).toContain("Warzywa");

    // Delete Warzywa
    await warzywa.getByTestId(/aisle-delete-/).click();
    await warzywa.getByTestId(/aisle-delete-/).click();
    await expect(
      page.locator('[data-testid^="aisle-row-"]', { hasText: "Warzywa" }),
    ).not.toBeVisible();
    await expect.poll(async () => (await aisleNames()).length).toBe(1);
  });
});
