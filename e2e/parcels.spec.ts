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

  test("mark parcel as completed", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    await page.locator("img[alt='Parcel']").first().click();
    await expect(
      page.locator("img[alt='Full size parcel']")
    ).toBeVisible();

    await page.getByRole("button", { name: "Mark as Completed" }).click();
    await expect(
      page.locator("img[alt='Full size parcel']")
    ).not.toBeVisible();

    const parcelButton = page.locator("button:has(img[alt='Parcel'])").first();
    await expect(parcelButton).toHaveClass(/brightness-50/);

    await parcelButton.click();
    await expect(
      page.locator("img[alt='Full size parcel']")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark as Completed" })
    ).not.toBeVisible();
  });

  test("add note to incoming parcel", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    const noteInput = page.locator('input[type="text"]').first();
    await noteInput.fill("the big one");
    await expect(noteInput).toHaveValue("the big one");
  });

  test("note persists after reload", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    const noteInput = page.locator('input[type="text"]').first();
    await noteInput.fill("4 packages on this QR");
    await expect(noteInput).toHaveValue("4 packages on this QR");

    await page.waitForTimeout(500);

    await page.reload();
    await expect(page.locator('input[type="text"]').first()).toHaveValue(
      "4 packages on this QR"
    );
  });

  test("add note to outgoing parcel", async ({ page }) => {
    await page.goto("/parcels/outgoing");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    const noteInput = page.locator('input[type="text"]').first();
    await noteInput.fill("urgent delivery");
    await expect(noteInput).toHaveValue("urgent delivery");
  });

  test("note input enforces max length", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    const noteInput = page.locator('input[type="text"]').first();
    await expect(noteInput).toHaveAttribute("maxLength", "100");
  });
});
