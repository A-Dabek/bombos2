---
name: qwik-quirks
description: Use when working with Qwik code.
---

# Qwik Quirks

Scope: `@builder.io/qwik` and `@builder.io/qwik-city`. Use before changing component structure, props, state, tasks, server functions, or e2e readiness waits.

## Docs (verified)

- Rendering: https://qwik.dev/docs/components/rendering/
- Reactivity: https://qwik.dev/docs/concepts/reactivity/
- Resumable (no hydration): https://qwik.dev/docs/concepts/resumable/
- State: https://qwik.dev/docs/components/state/
- Tasks & lifecycle: https://qwik.dev/docs/components/tasks/
- server$: https://qwik.dev/docs/server$/
- Playwright integration: https://qwik.dev/docs/integrations/playwright/

## Quirks

1. **`component$` boundaries re-render ONLY when props change.** A nested `component$` inside a mapped list can miss an update when the parent replaces an array prop. For a stateless list-render helper that receives changing props, MUST use a plain function wrapper, NOT `component$`. Ref: Rendering → "Rendering Child Components"; Reactivity → "Invalidating child components".
2. **Pass `signal.value`, not the whole `Signal`, when only the value is needed.** Ref: State → `useSignal()` NOTE.
3. **Reactivity is proxy-based and read-tracked.** A component subscribes only to state actually read during render. An early return that skips a read drops the subscription; keep reactive reads before conditional returns. Ref: Reactivity → "Unsubscribe example".
4. **`useTask$` runs server and/or browser and blocks render; `useVisibleTask$` is browser-only, after render, and is a last resort.** Prefer `useTask$` with an `isServer` guard. Ref: Tasks & lifecycle.
5. **State MUST be serializable to resume.** Class instances are NOT serializable; `Date`, `URL`, `Map`, `Set`, `Promise`, and `QRL`-wrapped closures are. Use `noSerialize()` for the rest. Ref: Resumable → "Serialization".
6. **Hooks MUST be at the root of `component$`.** No calls inside conditionals, loops, or `$(...)`. Ref: Tasks & lifecycle → "Use Hook Rules".
7. **`server$` async generators stream and keep the HTTP request open.** Tooling/tests that await the full body hang forever; MUST iterate and abort, never block on a streamed request. Ref: server$ → "Streaming Responses".
8. **Resume is not hydration, but lazy QRL chunks still load on first interaction.** `q:container="resumed"` is NOT sufficient to guarantee a click/fill lands. E2E MUST wait for interaction readiness before interacting. Ref: Resumable.
9. **Never put reactive conditional early returns in child components that emit events.** Render a stable JSX tree; let parents handle conditional rendering (repo rule).
