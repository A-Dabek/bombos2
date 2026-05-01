# ADR-018: Parcel Notification Indicator with Server Streaming

## Status
Accepted

## Context
Users need a visual indicator on the Parcels navigation tab that alerts them to incomplete parcels (parcels not yet marked as "completed"). The indicator must:

1. Be visible from **any page** in the app, not just when viewing the Parcels module
2. Update in **near real-time** when parcels are added or completed by any user
3. Use a **blue dot with ping animation** (Tailwind CSS) for visual consistency
4. Disappear immediately when all parcels are marked complete

The current architecture uses Qwik City with SQLite (better-sqlite3). Qwik provides built-in `server$` streaming via async generators, which is ideal for this use case — pushing updates from server to client over a persistent connection rather than repeated polling.

## Decision

### 1. Database Layer (`src/db/parcels.ts`)
Add a new function to count incomplete parcels:

```typescript
export function getIncompleteParcelsCount(db?: Database.Database): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "SELECT COUNT(*) as count FROM parcels WHERE completed_at IS NULL"
  ).get() as { count: number };
  return result.count;
}
```

### 2. Server Stream Function (`src/utils/parcel-count-stream.ts`)
Create a `server$` async generator that checks the DB every 1 second and yields the count:

```typescript
import { server$ } from '@builder.io/qwik-city';
import { getIncompleteParcelsCount } from '../db/parcels';

export const streamParcelCount = server$(async function* () {
  const CHECK_INTERVAL = 1000; // 1 second
  
  try {
    while (!this.signal.aborted) {
      const count = getIncompleteParcelsCount();
      yield count;
      
      // Wait for interval or until client disconnects
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, CHECK_INTERVAL);
        this.signal.addEventListener('abort', () => clearTimeout(timeout));
      });
    }
  } catch (error) {
    console.error('Parcel count stream error:', error);
    // Fail silently - stream ends
  }
});
```

### 3. Root Layout (`src/routes/layout.tsx`)
Modify the root layout to:
- Import `streamParcelCount`
- Use `useVisibleTask$` to start the stream when page is visible
- Iterate over streamed values with `for await...of` to update a signal
- Clean up the stream when page hides/unmounts
- Render the blue ping dot when count > 0

Key implementation details:

```typescript
import { component$, useSignal, useVisibleTask$, useOnDocument } from "@builder.io/qwik";
import { streamParcelCount } from "../utils/parcel-count-stream";

export default component$(() => {
  const parcelCount = useSignal(0);
  const streamAbortController = useSignal<AbortController | null>(null);

  useVisibleTask$(async ({ cleanup }) => {
    // Start streaming
    const stream = await streamParcelCount();
    
    // Iterate over streamed values
    (async () => {
      try {
        for await (const count of stream) {
          parcelCount.value = count;
        }
      } catch (error) {
        console.error('Stream iteration error:', error);
      }
    })();

    cleanup(() => {
      // Stream cleanup happens automatically when component unmounts
      // or we can explicitly break the for-await loop
    });
  });

  // ... render nav with dot
});
```

Visual indicator (positioned absolutely over the Parcels tab icon):

```tsx
<a href="/parcels" class="... relative ...">
  <HiCubeOutline class="h-5 w-5" />
  {parcelCount.value > 0 && (
    <span class="absolute -right-1 -top-1 flex h-3 w-3">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
    </span>
  )}
  <span>Parcels</span>
</a>
```

### 4. Error Handling
- Server-side: Log errors via `console.error`, then fail silently (stream ends)
- Client-side: If stream errors, the dot simply won't update (no crash, no fallback needed)

## Consequences

### Positive
- **Near real-time updates**: Max 1 second delay between parcel state change and UI update
- **Lower overhead**: Single persistent connection vs repeated HTTP polling requests
- **Leverages Qwik's built-in capabilities**: No additional libraries needed
- **Works across all pages**: Indicator visible from any route via root layout
- **Multi-user aware**: Server-side DB check catches changes made by any user

### Negative
- **Single server instance assumption**: Streaming approach assumes one server instance (shared SQLite file). If scaling to multiple instances, would need shared state mechanism.
- **Persistent connection**: Each connected client holds one server connection for the stream. For a mobile web app with limited concurrent users, this is acceptable.

## Acceptance Criteria

1. **AC1**: Blue dot with ping animation appears on Parcels tab when incomplete parcels exist
2. **AC2**: Dot is visible from any page in the app, not just Parcels module
3. **AC3**: Dot appears within 1 second of new parcel creation (any user)
4. **AC4**: Dot disappears within 1 second of all parcels being completed (any user)
5. **AC5**: No dot shown when all parcels are completed (count = 0)
6. **AC6**: Streaming connection pauses when page is hidden (tab switched away) via `useVisibleTask$`
7. **AC7**: Streaming resumes when page becomes visible again
8. **AC8**: Connection and stream clean up properly on unmount/disconnect
9. **AC9**: Server-side DB checks run every 1 second

## Tests to be Added

### Database Tests (`src/db/parcels.test.ts`)

```typescript
test("getIncompleteParcelsCount returns 0 on fresh DB", () => {
  resetDb();
  const db = openDb(":memory:");
  const count = getIncompleteParcelsCount(db);
  expect(count).toBe(0);
  db.close();
  resetDb();
});

test("getIncompleteParcelsCount returns correct count with mixed parcels", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes = new Uint8Array([1, 2, 3]);
  createParcel("incoming", bytes, "image/png", db);
  createParcel("outgoing", bytes, "image/jpeg", db);
  createParcel("incoming", bytes, "image/png", db);
  completeParcel(1, db); // complete first one
  
  const count = getIncompleteParcelsCount(db);
  expect(count).toBe(2); // 2 incomplete
  db.close();
  resetDb();
});

test("getIncompleteParcelsCount returns 0 when all completed", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes = new Uint8Array([1, 2, 3]);
  const id1 = createParcel("incoming", bytes, "image/png", db);
  const id2 = createParcel("outgoing", bytes, "image/jpeg", db);
  completeParcel(id1, db);
  completeParcel(id2, db);
  
  const count = getIncompleteParcelsCount(db);
  expect(count).toBe(0);
  db.close();
  resetDb();
});
```

### E2E Tests (`e2e/parcel-indicator.spec.ts`)

```typescript
test("blue dot appears when parcel uploaded", async ({ page }) => {
  await page.goto('/parcels/incoming');
  
  // Upload a parcel
  // ... upload steps ...
  
  // Navigate to home/meals page
  await page.click('a[href="/meals"]');
  
  // Wait for stream update (max 1s + buffer)
  await page.waitForTimeout(1500);
  
  // Check for blue dot on parcels tab
  const dot = page.locator('a[href="/parcels"] span.animate-ping');
  await expect(dot).toBeVisible();
});

test("blue dot disappears when all parcels completed", async ({ page }) => {
  await page.goto('/parcels/incoming');
  
  // Upload and complete all parcels
  // ... upload and complete steps ...
  
  // Navigate away
  await page.click('a[href="/meals"]');
  
  // Wait for stream update
  await page.waitForTimeout(1500);
  
  // Dot should be gone
  const dot = page.locator('a[href="/parcels"] span.animate-ping');
  await expect(dot).not.toBeVisible();
});

test("dot visible from any page", async ({ page }) => {
  // Upload parcel first (via API or direct navigation)
  // ... setup ...
  
  // Check on multiple pages
  for (const path of ['/meals', '/money', '/shopping', '/plan']) {
    await page.goto(path);
    await page.waitForTimeout(1500);
    const dot = page.locator('a[href="/parcels"] span.animate-ping');
    await expect(dot).toBeVisible();
  }
});
```
