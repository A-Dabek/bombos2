import { test, expect } from "@playwright/test";

test.describe("parcels", () => {
  test("redirects /parcels to /parcels/incoming", async ({ page }) => {
    await page.goto("/parcels");
    await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);
  });

  test("sub-navigation is visible", async ({ page }) => {
    await page.goto("/parcels/incoming");
    await expect(
      page.getByRole("link", { name: "Incoming" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Outgoing" })
    ).toBeVisible();
  });

  test("tab switching navigates and highlights", async ({ page }) => {
    await page.goto("/parcels/incoming");
    await page.getByRole("link", { name: "Outgoing" }).click();
    await expect(page).toHaveURL(/\/parcels\/outgoing\/?$/);
    const outgoingLink = page.getByRole("link", { name: "Outgoing" });
    await expect(outgoingLink).toHaveAttribute("class", /border-blue-500/);
    await expect(outgoingLink).toHaveAttribute("class", /text-blue-600/);
  });

  test("empty state is visible on fresh state", async ({ page }) => {
    await page.goto("/parcels/incoming");
    await expect(page.getByText("No parcels yet")).toBeVisible();
  });

  test("upload incoming image and see miniature", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
  });

  test("upload outgoing image and see miniature", async ({ page }) => {
    await page.goto("/parcels/outgoing");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
  });

  test("fullscreen open and close", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await page.locator("img[alt='Parcel']").first().click();
    await expect(
      page.locator("img[alt='Full size parcel']")
    ).toBeVisible();
    await page.locator("img[alt='Full size parcel']").click();
    await expect(
      page.locator("img[alt='Full size parcel']")
    ).not.toBeVisible();
  });

  test("persistence after reload", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
    await page.reload();
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
  });
});
