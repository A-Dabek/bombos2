# ADR-008: Parcels Code Unification

## Status
Accepted

## Context
The parcels module contains heavy duplication:

- `src/routes/parcels/incoming/index.tsx` and `outgoing/index.tsx` are identical 117-line page components; only the API path and page title differ.
- `src/routes/api/parcels/incoming/index.ts` and `outgoing/index.ts` are identical 30-line route handlers; only the hardcoded `type` parameter differs.
- The `Parcel` frontend type is copy-pasted in `ParcelList.tsx`, `ImageLightbox.tsx`, and both page files.
- `ImageLightbox.tsx` exists but is unused; both pages inline the same lightbox JSX.

## Decision
Keep the static file-system routes (`/parcels/incoming`, `/parcels/outgoing`) but extract all duplicated logic into shared abstractions:

1. **Shared page component** (`ParcelsPage`) accepting `type` and `title` props.
2. **Shared lightbox component** (`ParcelLightbox`) replacing the inline lightbox and the unused `ImageLightbox.tsx`.
3. **Shared frontend types** (`src/components/parcels/types.ts`) for the `Parcel` interface.
4. **Shared API handler factory** (`createParcelHandlers(type)`) used by both route files.

## Consequences

- **Positive**: Single source of truth for UI logic, data fetching, debounced notes, and API route behavior. Changes apply automatically to both screens.
- **Positive**: Thinner route files that purely delegate to shared code, making the routing structure explicit and easy to extend if needed.
- **Neutral**: E2E tests continue to run separately against both screens to validate route-specific behavior.
- **Negative**: Slightly more indirection for newcomers reading a route file, but the delegation is one line and well-named.
