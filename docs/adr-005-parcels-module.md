# ADR-005: Parcels Module

## Status
Accepted

## Context
The bombos2 app needs its first functional module. Parcels will allow users to upload mobile screenshots containing QR codes or numeric codes used to retrieve or send parcels via parcel machines. The first iteration requires two sub-pages (incoming and outgoing) with image upload, list, and fullscreen view capabilities.

## Decision
We will implement the Parcels module as a set of nested routes with dedicated API endpoints.

- **Routing**: `/parcels` redirects to `/parcels/incoming`. Incoming and outgoing are separate nested routes (`/parcels/incoming`, `/parcels/outgoing`) with a shared sub-navigation component.
- **Image storage**: Images are stored as BLOBs in SQLite, inline with the existing infrastructure. A `content_type` column is added as technical metadata required for proper client-side rendering.
- **API pattern**: Explicit `onGet`/`onPost` request handlers in dedicated API routes under `/api/parcels/{incoming,outgoing}`. This keeps data boundaries explicit and avoids `routeLoader$`/`routeAction$`.
- **API response format**: `onGet` returns JSON where the BLOB is base64-encoded. This lets the component render `<img src="data:{contentType};base64,...">` directly without extra image-serving endpoints.
- **Upload flow**: Client-side file input (triggered by a button) sends the image via `fetch()` as `multipart/form-data` to the corresponding API route. The server reads the `File`, stores its bytes as a BLOB, and returns `201 {id}`.
- **Sub-navigation**: A secondary tab bar below the main top navigation, styled similarly but distinct, allows switching between Incoming and Outgoing.
- **Fullscreen view**: Clicking a miniature opens an overlay with the full image. Clicking the full image closes the overlay.

## Alternatives Considered
- **Filesystem storage (Option B)**: Rejected because the user explicitly requested BLOB storage in SQLite for this iteration.
- **Single route with client-side tab state (Option B for routing)**: Rejected because nested routes allow direct linking, match Qwik City conventions, and simplify server-side filtering.
- **Dedicated image-serving endpoint (`/api/parcels/[id]/image`)**: Rejected to keep the first iteration simple; base64-in-JSON avoids an extra route and MIME-type sniffing complexity.

## Consequences
- The database file will grow as images are added. Retention/cleanup will be addressed in a later iteration.
- Base64 encoding increases response size by ~33%, acceptable for the expected parcel volume in the short term.
- No delete functionality yet; it will be added in a follow-up iteration.
- API routes are separate from page routes, which is slightly more files but maximizes explicitness.
