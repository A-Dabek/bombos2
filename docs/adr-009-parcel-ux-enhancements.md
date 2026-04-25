# ADR-009: Parcel UX Enhancements — Loaders, Animations, Image Compression

## Status
Accepted

## Context
The parcels module provides core functionality (upload, view, complete, notes) but lacks feedback during async operations and visual polish:

1. **No loading indicators**: Users see a blank screen while parcels fetch on page load, and the "Mark as Completed" button gives no feedback while the POST request is in flight.
2. **Static UI**: Sub-navigation, parcel grids, and the lightbox appear/disappear instantly without transitions.
3. **Uncompressed images**: Uploaded photos (mostly QR codes and numeric codes) are stored at full camera resolution, wasting SQLite storage and base64 bandwidth.

## Decision

### 1. Loading Spinners
- Add an `isLoading` signal to `ParcelsPage`. Display a centered spinning `HiArrowPath` icon (Tailwind `animate-spin`) while the initial `fetchParcels` is in flight and no cached data exists.
- Add an `isCompleting` signal to `ParcelsPage`. Pass it to `ParcelLightbox`. The "Mark as Completed" button replaces its text with a spinning icon and disables itself while `isCompleting` is true.

### 2. Subtle CSS Animations (no JS animation libraries)
All animations are implemented with Tailwind CSS transitions and keyframes to avoid extra dependencies and Qwik resumability pitfalls:

- **Sub-navigation (`ParcelSubNav`)**: Fade-in on mount via `animate-[fadeIn_0.3s_ease-out]`; smooth underline/color changes via `transition-all duration-300`.
- **Parcel list (`ParcelList`)**: The grid container uses `transition-opacity duration-300` and toggles from `opacity-0` to `opacity-100` after mount (triggered by `useVisibleTask$`), giving a gentle fade-in when parcels first load.
- **Lightbox (`ParcelLightbox`)**: Open/close uses fade + slight scale. `ParcelsPage` manages an `isLightboxVisible` signal. On open: set signal to `true`. On close: set signal to `false`, then after 300 ms clear `selectedParcel`. The lightbox root element applies `transition-all duration-300 opacity-0 scale-95` when hidden and `opacity-100 scale-100` when visible. This keeps the component in the DOM long enough for the CSS transition-out to complete.

### 3. Image Compression
- Introduce `sharp` as a server-side dependency.
- In `createParcelHandlers.ts`, inside the `onPost` handler, pass the raw `Uint8Array` through `sharp` before persisting:
  - Resize to max 800 px on the longest side (`resize(800, 800, { fit: 'inside' })`).
  - Output PNG with maximum compression (`png({ compressionLevel: 9, adaptiveFiltering: true })`).
  - Keep `contentType` as `image/png`.
- Add `sharp` to `pnpm.onlyBuiltDependencies` alongside `better-sqlite3`.
- Existing database rows are left untouched; compression applies only to new uploads.

## Consequences

- **Positive**: Users receive clear visual feedback during loads and actions, and the UI feels more responsive and polished.
- **Positive**: Smaller database size and faster base64 transfer for parcel images.
- **Positive**: No additional frontend animation libraries; pure CSS keeps the bundle small and avoids Qwik hydration edge cases.
- **Negative**: `sharp` is a native Node dependency, increasing build complexity (mitigated by adding it to `onlyBuiltDependencies`).
- **Negative**: Image compression is lossy; users lose original image fidelity, but this is acceptable because parcel images are functional (QR / text codes) rather than photographic.
