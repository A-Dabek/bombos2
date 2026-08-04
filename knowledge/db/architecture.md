---
type: Database Architecture
title: SQLite Database Architecture & Connection Management
description: Overview of better-sqlite3 database setup, connection singleton, directory creation, and test injection pattern in bombos2.
resource: /src/db/connection.ts
tags: [database, sqlite, better-sqlite3, connection, architecture]
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Database Architecture

`bombos2` uses **better-sqlite3** as its embedded relational database engine. Database connection management and lifecycle are centralized in `/src/db/connection.ts`.

## Connection Pattern & Lifecycle

1. **Database Storage Location**: Production database file resides at `./data/app.db`.
2. **Directory Initialization**: Opening `./data/app.db` automatically creates `./data/` directory if missing via `mkdirSync("./data", { recursive: true })`.
3. **Singleton Pattern**: `getDb()` maintains a module-level singleton instance (`dbInstance`).
4. **Auto-Migration Execution**: Every database opened via `openDb` automatically executes pending migrations using `runMigrations(db)` before returning the instance.

## Test Injection Pattern (`withDb`)

A critical architectural pattern across `bombos2` database functions is accepting an optional `db?: Database.Database` parameter:

```typescript
export function withDb<T>(db: Database.Database | undefined, fn: (db: Database.Database) => T): T {
  return fn(db ?? getDb());
}
```

In unit tests (`src/db/*.test.ts`), an isolated in-memory database (`new Database(":memory:")`) is created and injected directly into database access functions. This enables fast, completely isolated tests without touching or mutating file-system database state.

## Key Exports (`/src/db/connection.ts`)

- `getDb()`: Returns or initializes the global singleton `Database.Database` instance.
- `openDb(path: string)`: Opens a SQLite database file at `path` and runs migrations.
- `resetDb()`: Resets `dbInstance` to `null` (useful for resetting connection state).
- `withDb(db, fn)`: Helper that invokes `fn` with `db` if provided, or defaults to `getDb()`.

## Related Concepts

* [Migration Runner](/knowledge/db/migrations.md)
* [Data Access Modules](/knowledge/db/index.md#data-access-modules)
