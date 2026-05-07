import { test, expect } from "@playwright/test";
import { clearParcels, addParcelSql } from "./setup";

test.describe("parcels journeys", () => {
  test.beforeEach(() => {
    clearParcels();
  });

  test("Incoming Parcel Journey", async ({ page }) => {
    // 1. Land and check redirect
    await page.goto("/parcels");
    await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);

    // 2. Wait for loading to finish
    const loader = page.getByTestId("loader");
    if (await loader.isVisible()) {
      await expect(loader).toBeHidden();
    }

    // 3. Verify sub-nav state and empty state
    const incomingTab = page.getByTestId("sub-nav-tab-incoming");
    await expect(incomingTab).toHaveAttribute("class", /border-blue-500/);
    await expect(page.getByText("No parcels yet")).toBeVisible();

    // 4. Upload an incoming parcel (test compression .jpg -> .png)
    const fileInput = page.getByTestId("parcel-upload-input");
    const uploadPromise = page.waitForResponse(
      (res) => res.url().includes("/api/parcels/incoming") && res.request().method() === "POST",
    );
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.jpg");
    await uploadPromise;

    // Wait for UI to reflect upload
    await expect(page.getByTestId("parcel-uploading")).toBeHidden();
    const parcelImage = page.getByTestId("parcel-image").first();
    await expect(parcelImage).toBeVisible();

    // Verify compression
    const imgSrc = await parcelImage.getAttribute("src");
    expect(imgSrc).toMatch(/^data:image\/png;base64,/);

    // 5. Verify notification indicator (blue dot) appears
    await expect(page.getByTestId("parcel-notification-dot")).toBeVisible();

    // 6. Navigate away and verify dot persists
    await page.getByTestId("meals-nav-link").click();
    await expect(page.getByTestId("parcel-notification-dot")).toBeVisible();

    // 7. Go back and add a note
    await page.getByTestId("parcels-nav-link").click();
    const noteInput = page.getByTestId("parcel-note-input").first();
    await noteInput.fill("New incoming");

    // Wait for debounce and API persistence (300ms debounce)
    await page.waitForResponse(
      (res) => res.url().includes("/note") && res.request().method() === "POST",
    );

    await page.reload();
    await expect(page.getByTestId("parcel-note-input").first()).toHaveValue("New incoming");

    // 8. Lightbox and Completion
    await page.getByTestId("parcel-image").first().click();
    const lightboxImage = page.getByTestId("parcel-lightbox-image");
    await expect(lightboxImage).toBeVisible();

    const completeBtn = page.getByTestId("parcel-lightbox-complete-button");
    await completeBtn.click();

    // Wait for lightbox to close
    await expect(lightboxImage).not.toBeVisible();

    // 9. Verify notification dot is gone
    await expect(page.getByTestId("parcel-notification-dot")).not.toBeVisible();
  });

  test("Outgoing Parcel Journey", async ({ page }) => {
    // 1. Land on incoming and switch to outgoing
    await page.goto("/parcels");
    await page.getByTestId("sub-nav-tab-outgoing").click();
    await expect(page).toHaveURL(/\/parcels\/outgoing\/?$/);

    // 2. Wait for loading to finish
    const loader = page.getByTestId("loader");
    if (await loader.isVisible()) {
      await expect(loader).toBeHidden();
    }

    // 3. Verify sub-nav state and empty state
    const outgoingTab = page.getByTestId("sub-nav-tab-outgoing");
    await expect(outgoingTab).toHaveAttribute("class", /border-blue-500/);
    await expect(page.getByText("No parcels yet")).toBeVisible();

    // 4. Upload an outgoing parcel
    const fileInput = page.getByTestId("parcel-upload-input");
    const uploadPromise = page.waitForResponse(
      (res) => res.url().includes("/api/parcels/outgoing") && res.request().method() === "POST",
    );
    await fileInput.setInputFiles("e2e/fixtures/test-parcel.png");
    await uploadPromise;

    // Wait for UI to reflect upload
    await expect(page.getByTestId("parcel-uploading")).toBeHidden();
    const parcelImage = page.getByTestId("parcel-image").first();
    await expect(parcelImage).toBeVisible();

    // 5. Verify notification indicator (blue dot) appears
    await expect(page.getByTestId("parcel-notification-dot")).toBeVisible();

    // 6. Add a note
    const noteInput = page.getByTestId("parcel-note-input").first();
    await noteInput.fill("Urgent delivery");

    // Wait for debounce and API persistence
    await page.waitForResponse(
      (res) => res.url().includes("/note") && res.request().method() === "POST",
    );

    // 7. Lightbox and Completion
    await page.getByTestId("parcel-image").first().click();
    const lightboxImage = page.getByTestId("parcel-lightbox-image");
    await expect(lightboxImage).toBeVisible();

    const completeBtn = page.getByTestId("parcel-lightbox-complete-button");
    await completeBtn.click();

    // Wait for lightbox to close
    await expect(lightboxImage).not.toBeVisible();

    // 8. Verify notification dot is gone
    await expect(page.getByTestId("parcel-notification-dot")).not.toBeVisible();
  });

  test("Parcel Indicator Journey", async ({ page }) => {
    // 1. Setup an uncompleted parcel in DB (simulating someone else added it)
    addParcelSql("incoming");

    // 2. Go to a different module (Meals)
    await page.goto("/meals");

    // 3. Verify notification dot is visible
    await expect(page.getByTestId("parcel-notification-dot")).toBeVisible();

    // 4. Go to Parcels and complete it
    await page.getByTestId("parcels-nav-link").click();
    await expect(page).toHaveURL(/\/parcels\/incoming\/?$/);

    await page.getByTestId("parcel-image").first().click();
    await page.getByTestId("parcel-lightbox-complete-button").click();

    // Wait for lightbox to close
    await expect(page.getByTestId("parcel-lightbox-image")).not.toBeVisible();

    // 5. Verify dot is gone even in another module
    await page.getByTestId("money-nav-link").click();
    await expect(page.getByTestId("parcel-notification-dot")).not.toBeVisible();
  });

  test("Admin cleanup deletes completed parcels", async ({ page }) => {
    // 1. Add completed parcels directly via DB
    const now = Date.now();
    addParcelSql("incoming", now); // completed
    addParcelSql("outgoing", now); // completed

    // 2. Navigate to parcels admin via button
    await page.goto("/parcels/incoming");
    await page.getByTestId("admin-button").click();
    await expect(page).toHaveURL(/\/parcels\/admin\/?$/);

    // 3. Click "Run Cleanup" - first click enters confirming state, second triggers action
    const cleanupBtn = page.getByTestId("delete-btn");
    await expect(cleanupBtn).toBeVisible();
    await cleanupBtn.click(); // enter confirming state
    await cleanupBtn.click(); // trigger delete

    // Wait for API call to complete
    await page.waitForResponse((res) => res.url().includes("/api/parcels/admin/run-cleanup"));

    // 4. Verify success message appears
    await expect(page.getByText(/Deleted 2 parcels/)).toBeVisible();
  });
});
