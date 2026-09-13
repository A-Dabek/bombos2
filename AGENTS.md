# bombos2 Project Guidelines

## Project Overview

Qwik City household management app. Polish-language UI. SQLite database (better-sqlite3). Tailwind CSS v4. Fastify production server. pnpm package manager.

## Conventions

### TypeScript

- Strict mode. Target ES2020. Module ES2022.
- Path alias: `~/` maps to `./src/` (tsconfig `paths`).
- Qwik JSX: `"jsx": "react-jsx"`, `"jsxImportSource": "@builder.io/qwik"`.
- ESLint flat config with `eslint-plugin-qwik`.

### Qwik Patterns

- Route components: `src/routes/` (file-based routing).
- API endpoints: `src/routes/api/` — use `onGet`, `onPost` handlers.
- UI components: `src/components/<module>/`.
- Reactive state: `useSignal$`, `useVisibleTask$`, `useTask$`.
- **Critical**: Never put reactive conditional early returns in child components that emit events. Always render a stable JSX tree; let parents handle conditional rendering.
- Server entries: `src/entry.ssr.tsx`, `src/entry.dev.tsx`, `src/entry.fastify.tsx`.

### Database

- SQLite via `better-sqlite3` at `./data/app.db`.
- Connection singleton: `src/db/connection.ts` — `getDb()`, `openDb(path)`, `withDb(db, fn)`.
- Migrations: `src/db/migrations/NNN_name.sql`. Runner auto-discovers, sorts, executes in transactions.
- Data access modules: `src/db/<module>.ts` — one file per domain module.
- Unit tests colocated: `src/db/<module>.test.ts`.
- Test pattern: inject `new Database(":memory:")` via `withDb` — no filesystem side effects.

### Styling

- Tailwind CSS v4 (NOT v3 — different config approach).
- `src/global.css` for global styles.
- Dark mode via `dark:` classes + theme setting in DB.

### Testing

- **Unit tests**: Vitest (`pnpm test.db` runs `vitest run src/db`).
- **E2E tests**: Playwright in `e2e/` (`pnpm e2e`).
- E2E runs against built preview server on port 4173 with `AUTH_DISABLED=true`.

### Deployment

- Production targets Termux (Android) via `prod.sh`.
- Fastify adapter for server rendering.

## Knowledge Base Reference

Read these files for deep context on any module:

### Database Layer

- [Architecture & connection](knowledge/db/architecture.md)
- [Migration system](knowledge/db/migrations.md)
- [Schema docs](knowledge/db/schemas/) — per-module table structures
- [Data access modules](knowledge/db/modules/) — per-module DB functions

### UI Layer

- [UI architecture & Qwik patterns](knowledge/ui/architecture.md)
- [Component docs](knowledge/ui/components/) — per-module component specs

### Features

- [Feature overview](knowledge/features/overview.md)
- [Feature modules](knowledge/features/modules/) — per-module business logic

### ADRs

- [docs/](docs/) — 31 Architecture Decision Records covering all major design choices

## File Structure Quick Reference

```
src/
├── components/<module>/    # UI components (parcels, meals, plan, etc.)
├── db/                     # SQLite connection, migrations, modules
├── routes/api/<module>/    # REST API endpoints
├── routes/<module>/        # Page routes
├── utils/                  # Shared utilities
├── constants/              # Refresh context, etc.
├── plugins/                # Fastify-Qwik integration
└── server/                 # Cron scheduler

e2e/                        # Playwright E2E tests
knowledge/                  # OKF v0.2 knowledge base
docs/                       # ADRs
```

## Domain Modules

| Module    | DB File              | Components Dir            | API Route              |
|-----------|----------------------|---------------------------|------------------------|
| Parcels   | `src/db/parcels.ts`  | `src/components/parcels/` | `src/routes/api/parcels/` |
| Meals     | `src/db/meals.ts`    | `src/components/meals/`   | `src/routes/api/meals/`   |
| Plan      | `src/db/plan.ts`     | `src/components/plan/`    | `src/routes/api/plan/`    |
| Groceries | `src/db/groceries.ts`| `src/components/groceries/`| `src/routes/api/groceries/`|
| Bills     | `src/db/bills.ts`    | `src/components/bills/`   | `src/routes/api/bills/`   |
| Allowance | `src/db/allowance.ts`| `src/components/allowance/`| `src/routes/api/allowance/`|
| Balance   | `src/db/balance.ts`  | `src/components/balance/` | `src/routes/api/balance/` |
| Flows     | `src/db/flows.ts`    | `src/components/money/`   | `src/routes/api/flows/`   |
| Settings  | `src/db/settings.ts` | `src/components/settings/`| `src/routes/api/settings/`|
