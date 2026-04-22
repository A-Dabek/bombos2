# Specification: SQLite Data Layer Infrastructure

## Problem Description

The bombos2 app has no persistent storage. All four modules (Parcels, Meals, Money, Shopping) render static placeholders. Before any module can store or retrieve data, we need a reusable database infrastructure that:

- Provides a managed SQLite connection.
- Runs schema migrations automatically on first use.
- Is testable without side effects on the dev database.
- Integrates cleanly with Qwik City's explicit endpoint pattern (`onGet`, `onPost`, etc.).

## Proposed Solution

### 1. Dependency

Add `https://deno.land/x/sqlite` to `deno.json` imports under the alias `sqlite`.

### 2. Directory Structure

```
src/
  db/
    connection.ts         # getDb() singleton
    migrations.ts         # Lightweight migration runner
    migrations/
      001_init.sql        # Creates the _migrations tracking table
```

### 3. Connection (`src/db/connection.ts`)

- Imports `DB` from `sqlite`.
- Opens `./data/app.db`.
- On first invocation, ensures the `data/` directory exists.
- Returns the same `DB` instance on subsequent calls within the same Deno process.
- **Auto-initializes migrations**: calls `runMigrations(db)` before returning the instance.

### 4. Migrations (`src/db/migrations.ts`)

- Reads `.sql` files from `src/db/migrations/`.
- Files are ordered lexicographically by filename (numeric prefix convention: `001_`, `002_`, etc.).
- Skips already-applied migrations by checking the `_migrations` metadata table.
- Runs each new migration inside a transaction.
- Called automatically by `getDb()` so endpoints never need to invoke it manually.

### 5. Initial Migration (`src/db/migrations/001_init.sql`)

Creates the `_migrations` table:

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at INTEGER NOT NULL
);
```

### 6. Gitignore

Add `/data/` to `.gitignore` so the SQLite database file is never committed.

### 7. Integration with Endpoints

Future module endpoints will import `getDb()` and execute parameterized queries. Example pattern:

```ts
import { getDb } from "~/db/connection";

export const onGet: RequestHandler = async ({ json }) => {
  const db = getDb();
  const rows = [...db.query("SELECT id, name FROM parcels")];
  json(200, rows);
};
```

## Acceptance Criteria

- [ ] `deno.json` includes `"sqlite": "https://deno.land/x/sqlite/mod.ts"` in `imports`.
- [ ] `src/db/connection.ts` exports `getDb()` that returns an open `DB` instance.
- [ ] `src/db/migrations.ts` exports `runMigrations(db: DB)` that applies pending migrations.
- [ ] `src/db/migrations/001_init.sql` creates the `_migrations` tracking table.
- [ ] Running `deno task dev` and hitting any endpoint that calls `getDb()` creates `./data/app.db` and the `_migrations` table.
- [ ] `.gitignore` contains `/data/`.
- [ ] `deno task build.types` passes without errors.
- [ ] No business tables are created yet; only the infrastructure layer is established.

## Tests to be Added

### `src/db/connection.test.ts`

Integration tests for the connection utility:

- **Opens a connection**: `getDb()` returns a `DB` instance that can execute a simple query.
- **Auto-runs migrations**: After calling `getDb()`, the `_migrations` table exists.
- **Singleton behavior**: Multiple calls return the same open instance (or at least a working connection to the same file).
- **Cleanup**: Uses an in-memory or temporary file path so tests do not touch `./data/app.db`.

### `src/db/migrations.test.ts`

Integration tests for the migration runner:

- **Applies new migrations**: Given a temporary migration file, `runMigrations()` executes it and records the filename in `_migrations`.
- **Skips applied migrations**: Running `runMigrations()` a second time does not re-apply the same migration.
- **Transaction safety**: If a migration fails, it is not recorded as applied.
- **Cleanup**: Removes temporary migration files after the test.

### Note on Testing Conventions

The project currently uses **Playwright** for E2E tests (`e2e/`). For server-side data-layer logic, standard **Deno `*.test.ts` files** are the right choice — they test utilities directly without requiring a browser or dev server. These can be run with `deno test`.
