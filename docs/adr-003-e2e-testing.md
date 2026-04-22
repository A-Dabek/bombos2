# ADR-003: E2E Testing with Playwright

## Status
Accepted

## Context
The project had no existing tests. Navigation is a critical user journey that is best verified through end-to-end browser automation.

## Decision
We will set up Playwright as the E2E testing framework.

- **Playwright** provides reliable cross-browser testing and works well with Vite-based apps.
- With Deno, we will add `playwright` and `@playwright/test` via npm specifiers in `deno.json`.
- A new `e2e/` directory will hold spec files.
- A `deno task e2e` command will be added to run the tests.

## Initial Test Scope
- `e2e/nav.spec.ts` will verify:
  1. All four nav tabs are visible.
  2. Clicking each tab navigates to the correct URL.
  3. The active tab receives the correct visual state.
  4. The home route (`/`) redirects to `/parcels`.

## Consequences
- Developers must run the dev server (`deno task dev`) before executing E2E tests locally.
- CI/CD should eventually be configured to run `deno task e2e`.