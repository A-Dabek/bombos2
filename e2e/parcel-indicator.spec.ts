import { test, expect } from "@playwright/test";
import { clearParcels } from "./setup";

test.describe("parcel notification indicator", () => {
  test.beforeEach(() => {
    clearParcels();
  });

  test("blue dot appears when parcel uploaded", async ({ page }) => {
    await page.goto("/parcels/incoming");

    // Upload a parcel
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    // Navigate to meals page
    await page.click('a[href="/meals"]');

    // Check for blue dot on parcels tab (stream updates within 1s, timeout 5s)
    const dot = page.locator('a[href="/parcels"] span.animate-ping');
    await expect(dot).toBeVisible();
  });

  test("blue dot disappears when all parcels completed", async ({ page }) => {
    await page.goto("/parcels/incoming");

    // Upload a parcel
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    // Complete the parcel
    await page.locator("img[alt='Parcel']").first().click();
    await page.getByRole("button", { name: "Mark as Completed" }).click();
    await expect(page.locator("img[alt='Full size parcel']")).not.toBeVisible();

    // Navigate to meals page
    await page.click('a[href="/meals"]');

    // Dot should be gone
    const dot = page.locator('a[href="/parcels"] span.animate-ping');
    await expect(dot).not.toBeVisible();
  });

  test("dot visible from any page", async ({ page }) => {
    // Upload a parcel first
    await page.goto("/parcels/incoming");
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    // Check on multiple pages
    for (const path of ["/meals", "/money", "/shopping", "/plan"]) {
      await page.goto(path);
      const dot = page.locator('a[href="/parcels"] span.animate-ping');
      await expect(dot).toBeVisible();
    }
  });

  test("dot reappears when new parcel uploaded after all completed", async ({ page }) => {
    await page.goto("/parcels/incoming");

    // Upload and complete
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();
    await page.locator("img[alt='Parcel']").first().click();
    await page.getByRole("button", { name: "Mark as Completed" }).click();

    // Navigate away, dot should be gone
    await page.click('a[href="/meals"]');
    let dot = page.locator('a[href="/parcels"] span.animate-ping');
    await expect(dot).not.toBeVisible();

    // Upload new parcel on incoming page
    await page.goto("/parcels/incoming");
    const newFileInput = page.locator('input[type="file"]');
    await newFileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await expect(page.locator("img[alt='Parcel']").first()).toBeVisible();

    // Navigate away, dot should reappear
    await page.click('a[href="/money"]');
    dot = page.locator('a[href="/parcels"] span.animate-ping');
    await expect(dot).toBeVisible();
  });
});
