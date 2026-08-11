# bombos2 Specification

## Project Overview
- **Name**: bombos2
- **Type**: Mobile Web App
- **Stack**: Qwik City, Tailwind CSS, SQLite (better-sqlite3), Node, pnpm

## References
- Qwik Getting Started: https://qwik.dev/docs/getting-started/
- **Note**: See `README.md` for Qwik project structure, commands, and development info

## Commands
- `pnpm dev` — Start dev server
- `pnpm build` — Production build
- `pnpm build.types` — TypeScript check
- `pnpm preview` — Preview production build
- `pnpm e2e` — Run Playwright end-to-end tests
- `pnpm test.db` — Run vitest database unit tests

## Architecture
- **Database**: better-sqlite3 with migrations in `src/db/migrations/NNN_name.sql`
- **API**: Qwik City route handlers (`onGet` / `onPost`)
- **Pages**: Client-side data fetching via `useVisibleTask$`
- **Styling**: Tailwind CSS utility classes
- **Icons**: `@qwikest/icons/heroicons`

## Key Patterns
- DB functions accept an optional `db` parameter for test injection.
- Parcel pages (`/parcels/incoming`, `/parcels/outgoing`) are nearly identical; changes usually apply to both.
- **Critical Qwik gotcha**: Never put reactive conditional early returns in child components that emit events to parents. Always render a stable JSX tree in children; let the parent handle conditional rendering.

## Existing Modules
- **Parcels**: Upload images, grid view with lightbox, mark-as-complete, daily auto-cleanup, per-parcel notes (ADR-007).
- **Meals / Money / Shopping**: Placeholder routes.

## Testing
- **E2E**: Playwright tests in `e2e/`; use `e2e/fixtures/test-parcel.png` for upload tests.
- **DB**: vitest tests in `src/db/*.test.ts`.

## Decision Records
ADRs are stored in `docs/adr-NNN-*.md`.

## Knowledge Base & Agent Skills
- **Knowledge Base**: `/knowledge/` contains structured OKF (Open Knowledge Format) documentation for DB schemas, UI components, system architecture, and features.
- **Knowledge Skills**:
  - `read-docs`: Use when navigating, searching, or reading documentation/knowledge base files in `/knowledge/` to build context efficiently without context bloat.
  - `write-docs`: Use when creating or updating knowledge base documents in `/knowledge/` to ensure adherence to OKF v0.2 (`/knowledge/SPEC.md`) and repository profile (`/knowledge/SIMPLIFICATIONS.md`).
  - **Note**: Agents must actively pick up and read these skills whenever interacting with `/knowledge/` documentation.
