# Specification: Parcels Module

## Problem Description

The Parcels route (`/parcels`) is currently a static placeholder. Users need a functional module to:

1. Organize parcel screenshots by direction: **incoming** (retrieving) and **outgoing** (sending).
2. Upload new screenshots via a button that opens the native image picker.
3. View uploaded screenshots as miniatures in a list.
4. Tap a miniature to view it fullscreen, and tap again to close.

This iteration covers create and read only; update, delete, and retention policies are out of scope.

## Proposed Solution

### 1. Database Schema

Add migration `src/db/migrations/002_parcels.sql`:

```sql
CREATE TABLE IF NOT EXISTS parcels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('incoming', 'outgoing')),
  image BLOB NOT NULL,
  content_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

Rationale: `content_type` (e.g. `image/png`) is required so the client can construct valid `data:` URLs from the base64-encoded BLOB. This is technical metadata, not business data.

### 2. Data Access Layer

Create `src/db/parcels.ts` exporting:

- `getParcels(type: 'incoming' | 'outgoing'): ParcelRow[]`
  - Queries `parcels` table filtered by `type`.
  - Returns rows including `id`, `type`, `image` (as `Uint8Array`), `content_type`, `created_at`.
- `createParcel(type: 'incoming' | 'outgoing', image: Uint8Array, contentType: string): number`
  - Inserts a new parcel record.
  - Returns the generated `id`.

These functions are thin wrappers over parameterized SQL queries. The API endpoints will call them directly.

### 3. API Routes

Create dedicated API routes under `src/routes/api/parcels/`:

- **`src/routes/api/parcels/incoming/index.ts`**
  - `onGet`: Calls `getParcels('incoming')`, encodes each `image` BLOB to base64 using `encodeBase64` from Deno std, and returns `200` JSON array: `{ id, type, imageBase64, contentType, createdAt }`.
  - `onPost`: Reads `multipart/form-data` from the request, extracts the `image` file, reads it into a `Uint8Array`, calls `createParcel('incoming', bytes, file.type)`, and returns `201 { id }`.

- **`src/routes/api/parcels/outgoing/index.ts`**
  - Identical to incoming but uses `'outgoing'`.

The type is implicit from the URL path, keeping the POST body minimal (just the file).

### 4. Page Routes

Update/create route files under `src/routes/parcels/`:

- **`src/routes/parcels/index.tsx`**
  - Exports `onGet` that throws a `302` redirect to `/parcels/incoming`.
  - No component needed (or a minimal redirecting placeholder).

- **`src/routes/parcels/incoming/index.tsx`**
  - Exports the page component.
  - Renders the **Parcel Sub-Navigation** (Incoming / Outgoing tabs).
  - Renders the **Parcel List** component configured for incoming parcels.
  - Renders the **Upload Button**.
  - On mount, fetches `/api/parcels/incoming` and stores parcels in local component state.

- **`src/routes/parcels/outgoing/index.tsx`**
  - Mirrors the incoming page but fetches `/api/parcels/outgoing`.

### 5. UI Components (High-Level)

The following components should be created under `src/components/parcels/` (or similar shared location):

- **ParcelSubNav**: Horizontal tab links for `/parcels/incoming` and `/parcels/outgoing`. Highlights the active route.
- **ParcelList**: Grid of image miniatures. Each miniature is an `<img>` rendered from the base64 data. If the list is empty, renders an empty-state message (e.g., "No parcels yet").
- **UploadButton**: A visible button that programmatically clicks a hidden `<input type="file" accept="image/*">`. On file selection, sends a `fetch()` POST to the relevant API route, then triggers a list refresh.
- **ImageLightbox**: A fixed-position overlay that covers the viewport. Displays the full-size base64 image. Clicking the image (or overlay background) closes it.

### 6. Interaction Flow

1. User navigates to `/parcels`.
2. Server redirects to `/parcels/incoming`.
3. Page component fetches incoming parcel list from `/api/parcels/incoming`.
4. User sees sub-navigation (Incoming active) and list of miniatures (or empty state).
5. User clicks Upload Button → native file picker opens.
6. User selects an image → client `fetch()` POSTs to `/api/parcels/incoming`.
7. On success, client re-fetches the list → new miniature appears.
8. User taps a miniature → `ImageLightbox` opens with full image.
9. User taps the full image → `ImageLightbox` closes.
10. User taps "Outgoing" in sub-nav → navigates to `/parcels/outgoing`.

## Acceptance Criteria

- [ ] `/parcels` performs a server-side `302` redirect to `/parcels/incoming`.
- [ ] Sub-navigation is visible on both `/parcels/incoming` and `/parcels/outgoing`, with the active tab visually highlighted.
- [ ] When no parcels exist, an empty-state message is displayed instead of a blank grid.
- [ ] The upload button opens the device's native image picker.
- [ ] After selecting an image, the new parcel appears in the current list without a full page reload.
- [ ] Uploaded images persist after server restart (verified by refreshing the page).
- [ ] Miniatures are rendered in a responsive grid/list layout suitable for mobile.
- [ ] Tapping a miniature opens a fullscreen overlay containing the full image.
- [ ] Tapping the fullscreen image (or the overlay) closes it.
- [ ] Switching between Incoming and Outgoing tabs shows the correct, isolated lists.
- [ ] `deno task build.types` passes without errors.
- [ ] `deno task dev` starts successfully and the module is usable.

## Tests to be Added

### E2E Tests (`e2e/parcels.spec.ts`)

These follow the existing Playwright convention and test the full user flow.

**Prerequisite**: Add a small test image at `e2e/fixtures/test-parcel.png` (any valid PNG, e.g., a 100x100 solid color image).

Tests:
1. **Redirect**: Navigating to `/parcels` lands on `/parcels/incoming`.
2. **Sub-navigation visibility**: Both "Incoming" and "Outgoing" links are visible on the parcels page.
3. **Tab switching**: Clicking "Outgoing" navigates to `/parcels/outgoing` and highlights it.
4. **Empty state**: On a fresh state, the empty-state message is visible.
5. **Upload incoming**: On `/parcels/incoming`, click upload button, attach `test-parcel.png`, and verify a new miniature appears in the list.
6. **Upload outgoing**: Same as above on `/parcels/outgoing`.
7. **Fullscreen open/close**: Click a miniature, verify a fullscreen image is visible, click it, verify it closes.
8. **Persistence**: After upload, reload the page and verify the parcel is still listed.

### DB Integration Tests (`src/db/parcels.test.ts`)

These use Deno `Deno.test` following the existing `src/db/*.test.ts` convention.

Tests (using an in-memory or temporary DB via `openDb`):
1. **getParcels returns empty array**: Calling `getParcels('incoming')` on a fresh DB returns `[]`.
2. **createParcel inserts record**: `createParcel('incoming', bytes, 'image/png')` returns a numeric `id`.
3. **getParcels filters by type**: After inserting one incoming and one outgoing parcel, `getParcels('incoming')` returns only the incoming one.
4. **getParcludes returns image data**: Retrieved rows include the original `Uint8Array` image bytes and correct `content_type`.

### API Integration Tests (optional but recommended)

If desired, add `src/routes/api/parcels/parcels-api.test.ts` (Deno test) that starts a minimal handler or tests the endpoint logic directly. However, the E2E tests above cover the API surface via the UI. The DB tests cover data integrity. Combined, they provide sufficient coverage for the first iteration.
