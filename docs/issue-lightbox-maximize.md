# Known Issue: Fullscreen / Lightbox Maximizing Fails

## Status
Open — E2E test `fullscreen open and close` fails consistently.

## Symptom
Clicking a parcel miniature does **not** open the fullscreen overlay containing the full base64 image. The E2E test times out waiting for `img[alt='Full size parcel']`.

## What Works
- Uploading images (incoming & outgoing)
- List re-rendering after upload (`parcels` signal updates correctly)
- Sub-navigation, redirects, empty state, persistence across reloads

## What Does Not Work
- Conditional rendering of the lightbox overlay based on `useSignal` state updated inside a click handler.

## Failed Attempts

### 1. `PropFunction` typing
Changed custom callback props from `(x) => void` to `PropFunction<(x) => void>`.
- Result: type-check passes, runtime still fails.

### 2. Non-destructured props
Accessed callback props via `props.onSelect$` instead of destructuring in `component$`.
- Result: type-check passes, runtime still fails.

### 3. Explicit `$()` wrappers
Extracted inline handlers into standalone `$(...)` constants in the parent component.
- Result: type-check passes, runtime still fails.

### 4. Inlining lightbox JSX directly in page route
Removed the `ImageLightbox` child component and placed the overlay markup directly inside `src/routes/parcels/incoming/index.tsx` (and outgoing).
- Result: type-check passes, runtime still fails.

### 5. Always-mounted child component
Changed `ImageLightbox` to always render (return `<div class="hidden" />` when closed).
- Result: type-check passes, runtime still fails.

## Hypothesis
Qwik's resumability / reactivity model does not reliably trigger DOM updates for conditional JSX when a `useSignal` is mutated inside an event handler that crosses a `component$` boundary (even with `PropFunction` and non-destructured props). The `parcels` signal works because it is updated inside `useVisibleTask$` or an `onUpload$` callback that re-fetches data, but the `selectedParcel` signal write inside `onClick$` does not cause the parent page component to re-evaluate its conditional `{selectedParcel.value && (...)}`.

## Next Steps to Try
- Use `useStore` instead of `useSignal` for `selectedParcel` state.
- Manage lightbox visibility entirely inside `ParcelList` (same component where the click originates) to avoid cross-component callback serialization.
- Use a CSS-only approach (always render the overlay but toggle `opacity`/`pointer-events` with a class) driven by a `useStore` boolean.
- Check if Qwik's `useTask$` or `useComputed$` can proxy the signal change into a reactive boolean.

## Files Involved
- `src/routes/parcels/incoming/index.tsx`
- `src/routes/parcels/outgoing/index.tsx`
- `src/components/parcels/ParcelList.tsx`
- `src/components/parcels/ImageLightbox.tsx`
- `e2e/parcels.spec.ts` (test #7)
