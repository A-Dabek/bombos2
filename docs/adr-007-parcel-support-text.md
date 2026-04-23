# ADR-007: Parcel Support Text

## Status
Accepted

## Context
Users need to attach short textual notes to individual parcels to remember important details, e.g. "the big one" when sending packages or "4 packages on this QR" when retrieving them. This note must be visible directly on the parcel grid, editable inline, and persisted automatically.

## Decision

### 1. Database Schema
Add a `note TEXT` column to the `parcels` table via migration `004_parcels_note.sql`. The column is nullable and defaults to `NULL`.

### 2. Data Access Layer
- Extend `ParcelRow` and `getParcels` in `src/db/parcels.ts` to include `note`.
- Add `updateParcelNote(id: number, note: string, db?)` function that executes `UPDATE parcels SET note = ? WHERE id = ?`.
- The `note` parameter is passed as-is; empty strings are stored as empty strings rather than coerced to `NULL`.

### 3. API Design
Following the existing per-action endpoint pattern (`POST /api/parcels/[id]/complete`), a new endpoint is introduced:
- `POST /api/parcels/[id]/note` — accepts JSON body `{ note: string }`, validates max length of 100 characters (returning 400 if exceeded), and calls `updateParcelNote`.
- `GET /api/parcels/{incoming,outgoing}` is updated to include the `note` field in the JSON response.

### 4. UI / UX
- **Location**: A single-line text `<input>` is rendered directly below each parcel thumbnail inside `ParcelList`.
- **Visibility**: The input is always visible, even when empty. It shows a placeholder such as "Note...".
- **Persistence**: On every keystroke a debounced save fires after 300ms of inactivity. No explicit Save button is provided, matching the mobile-first design.
- **Optimistic update**: The parent page component updates its local `parcels` signal immediately when the input changes so that re-renders do not reset the input value back to the server state.
- **No re-fetch on save**: After a successful note save, the parcel list is not re-fetched, avoiding input focus loss and unnecessary network traffic.
- **Max length**: `maxLength={100}` on the input element; server rejects notes longer than 100 chars with HTTP 400.
- **Completed parcels**: Notes remain editable even for completed parcels because the user did not specify otherwise.

### 5. Component Changes
- `ParcelList` receives a new `onNoteChange$: PropFunction<(id: number, note: string) => void>` prop.
- `ParcelList` renders each parcel inside a flex column (`flex flex-col`) so the input sits naturally below the image button.
- Incoming and outgoing page components (`src/routes/parcels/{incoming,outgoing}/index.tsx`) implement the debounced `updateNote$` handler using a `useSignal` to store the active timeout ID.

## Alternatives Considered
- **Note inside lightbox only**: Rejected because the user explicitly requested the input directly below each miniature for at-a-glance visibility.
- **Save on blur instead of debounce**: Rejected because mobile users may navigate away without blurring the field; debounce is safer for automatic persistence.
- **Separate `PATCH /api/parcels/[id]` generic update endpoint**: Rejected in favor of a dedicated `POST /api/parcels/[id]/note` to stay consistent with the existing `POST /api/parcels/[id]/complete` endpoint style.
- **Storing notes in a separate table**: Rejected as unnecessary over-engineering; a single nullable column on the existing table is the simplest solution.

## Consequences
- `parcels` table grows by one nullable column; no impact on existing rows.
- `ParcelList` grid items grow vertically to accommodate the input, slightly reducing the number of visible rows per screen.
- Debounced saves mean transient network errors may go unnoticed by the user; this is acceptable for a lightweight note field.
- The feature applies identically to both incoming and outgoing parcels with no type-specific logic.
