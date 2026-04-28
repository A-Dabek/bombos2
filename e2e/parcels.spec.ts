import { test, expect } from "@playwright/test";
import { clearParcels } from "./setup";

test.describe("parcels", () => {
  test.beforeEach(() => {
    clearParcels();
  });
  test("redirects /parcels to /parcels/incoming", async ({ page }) => {
    await page.goto("/parcels");
    await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);
  });

  test("tab navigation works correctly", async ({ page }) => {
    await page.goto("/parcels/incoming");
    // Sub-navigation visible
    await expect(page.getByRole("link", { name: "Incoming" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Outgoing" })).toBeVisible();
    // Tab switching + highlights
    await page.getByRole("link", { name: "Outgoing" }).click();
    await expect(page).toHaveURL(/\/parcels\/outgoing\/?$/);
    const outgoingLink = page.getByRole("link", { name: "Outgoing" });
    await expect(outgoingLink).toHaveAttribute("class", /border-blue-500/);
    await expect(outgoingLink).toHaveAttribute("class", /text-blue-600/);
  });

  test("empty state and loading spinner", async ({ page }) => {
    await page.goto("/parcels/incoming");
    // Empty state (includes loading spinner test)
    await expect(page.locator("svg.animate-spin")).toBeVisible();
    await expect(page.getByText("No parcels yet")).toBeVisible();
    await expect(page.locator("img[alt='Parcel']").first()).toBeHidden();
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
    await expect(page.locator("img[alt='Full size parcel']")).toBeVisible();
    await page.locator("img[alt='Full size parcel']").click();
    await expect(page.locator("img[alt='Full size parcel']")).not.toBeVisible();
  });

  test("image persistence after reload", async ({ page }) => {
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
    await expect(page.locator("img[alt='Full size parcel']")).toBeVisible();

    await page.getByRole("button", { name: "Mark as Completed" }).click();
    await expect(page.locator("img[alt='Full size parcel']")).not.toBeVisible();

    const parcelButton = page.locator("button:has(img[alt='Parcel'])").first();
    await expect(parcelButton).toHaveClass(/brightness-50/);

    await parcelButton.click();
    await expect(page.locator("img[alt='Full size parcel']")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark as Completed" })).not.toBeVisible();
  });

  test("note CRUD: add, persist, enforce max length", async ({ page }) => {
    // Incoming note
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    const noteInput = page.locator('input[type="text"]').first();
    await noteInput.fill("the big one");
    await expect(noteInput).toHaveValue("the big one");
    // Max length
    await expect(noteInput).toHaveAttribute("maxLength", "100");
    // Persistence - wait for API then reload
    await page.waitForResponse(
      (res) => res.url().includes("/api/parcels") && res.request().method() === "POST"
    );
    await page.reload();
    await expect(page.locator('input[type="text"]').first()).toHaveValue("the big one");

    // Outgoing note
    await page.goto("/parcels/outgoing");
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
    const outgoingNoteInput = page.locator('input[type="text"]').first();
    await outgoingNoteInput.fill("urgent delivery");
    await expect(outgoingNoteInput).toHaveValue("urgent delivery");
  });

  test("mark as completed shows loading state", async ({ page }) => {
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    await page.locator("img[alt='Parcel']").first().click();
    await expect(page.locator("img[alt='Full size parcel']")).toBeVisible();

    await page.route("**/api/parcels/*/complete", async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      await route.continue();
    });

    const completeBtn = page.getByRole("button", { name: "Mark as Completed" });
    await completeBtn.click();

    await expect(page.getByRole("button", { name: "Saving..." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Saving..." })).toBeDisabled();

    await expect(completeBtn).toBeHidden();
    await expect(page.locator("img[alt='Full size parcel']")).not.toBeVisible();
  });

  test("image is compressed on upload", async ({ page }) => {
    await page.goto("/parcels/incoming");

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/parcels/incoming") && res.request().method() === "POST"
    );

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.jpg");

    const response = await responsePromise;
    expect(response.status()).toBe(201);
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    const imgSrc = await page.locator("img[alt='Parcel']").first().getAttribute("src");
    expect(imgSrc).toMatch(/^data:image\/png;base64,/);
  });
});