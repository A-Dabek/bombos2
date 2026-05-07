# Task 001: Parcels Cleanup — On-Demand Button

## Goal
Export `runCleanup()` from scheduler, create `/parcels/admin` page with "Run Cleanup" button, add E2E test.

## Steps

### 1. Export `runCleanup` from `src/server/scheduler.ts`
- Add `export` to `runCleanup()` function
- Add `export` to `deleteCompletedParcels` import (already imported)

### 2. Create API endpoint `src/routes/api/parcels/admin/run-cleanup.ts`
- POST endpoint
- Calls `deleteCompletedParcels()` from scheduler
- Returns JSON: `{ "success": true, "deleted": 5 }`

### 3. Create Parcels Admin page
- Create directory: `src/routes/parcels/admin/`
- Create `src/routes/parcels/admin/index.tsx`:
  ```tsx
  import { component$ } from "@builder.io/qwik";
  import type { DocumentHead } from "@builder.io/qwik-city";
  import BackButton from "~/components/shared/BackButton";
  import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
  
  export default component$(() => {
    const loading = useSignal(false);
    const error = useSignal<string | null>(null);
    const success = useSignal(false);
    const deletedCount = useSignal(0);
    
    const handleCleanup = $(async () => {
      loading.value = true;
      error.value = null;
      success.value = false;
      try {
        const res = await fetch("/api/parcels/admin/run-cleanup", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to run cleanup");
        deletedCount.value = data.deleted;
        success.value = true;
      } catch (e: any) {
        error.value = e.message;
      } finally {
        loading.value = false;
      }
    });
    
    return (
      <div class="p-4">
        <BackButton href="/parcels" />
        <h1 class="text-xl font-semibold">Parcels Admin</h1>
        
        {error.value && <p class="mt-2 text-red-600">{error.value}</p>}
        {success.value && (
          <p class="mt-2 text-green-600">
            Cleanup complete. Deleted {deletedCount.value} parcels.
          </p>
        )}
        
        <div class="mt-4">
          <DoubleConfirmButton
            onConfirm$={handleCleanup}
            text="Run Cleanup"
            class="px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
            disabled={loading.value}
          />
        </div>
      </div>
    );
  });
  
  export const head: DocumentHead = {
    title: "Parcels Admin",
  };
  ```

### 4. Add link to Parcels page
- Edit `src/routes/parcels/index.tsx` or `src/components/parcels/ParcelsPage.tsx`
- Add "Admin" link/button that navigates to `/parcels/admin`

### 5. E2E Test
Create `e2e/parcels-cleanup.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test("Parcels cleanup button works", async ({ page }) => {
  // Navigate to parcels admin
  await page.goto("/parcels/admin");
  
  // Add completed parcels via API (setup)
  await page.request.post("/api/parcels/incoming", {
    multipart: { image: { name: "test.png", mimeType: "image/png", buffer: Buffer.from("fake") } }
  });
  // Mark as completed via API
  // ... (use DB or API to complete parcel)
  
  // Click "Run Cleanup"
  await page.getByText("Run Cleanup").click();
  
  // Confirm in double-confirm
  await page.getByText("Confirm").click();
  
  // Verify success message
  await expect(page.getByText(/Deleted \d+ parcels/)).toBeVisible();
});
```

## Acceptance Criteria
- [ ] `runCleanup` exported from `scheduler.ts`
- [ ] `POST /api/parcels/admin/run-cleanup` returns `{ "success": true, "deleted": number }`
- [ ] `/parcels/admin` page renders with "Run Cleanup" button
- [ ] Button uses `DoubleConfirmButton`, shows loading state
- [ ] Success message shows deleted count
- [ ] Link to admin page from parcels main page
- [ ] E2E test passes: `npx playwright test e2e/parcels-cleanup.spec.ts`
