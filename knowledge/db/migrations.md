---
type: Database Architecture
title: Migration System & Schema Evolution
description: Dynamic migration runner that discovers, orders, and applies SQL migration scripts using SQLite transactions.
resource: /src/db/migrations.ts
tags: [database, migrations, sqlite, schema, ddl]
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Migration System & Schema Evolution

Database migrations in `bombos2` are managed dynamically by `/src/db/migrations.ts`. Schema migrations are written as standard `.sql` files in `/src/db/migrations/`.

## Naming Convention & Directory

Migration files follow the sequential prefix pattern:
`/src/db/migrations/NNN_name.sql`

Example migration files:
- `001_init.sql`
- `002_parcels.sql`
- `013_bills.sql`
- `029_groceries_stats.sql`

## Tracking Table (`_migrations`)

Applied migrations are tracked in a dedicated system table:

```sql
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at INTEGER NOT NULL
);
```

## Migration Execution Algorithm

When `runMigrations(db)` is invoked:
1. **Bootstrap**: Creates `_migrations` table if it does not already exist.
2. **Read Applied**: Queries `SELECT name FROM _migrations` to get the set of applied migration names.
3. **Discover**: Reads all files in `src/db/migrations` ending with `.sql`.
4. **Sort**: Sorts migration filenames alphabetically (`migrationFiles.sort()`).
5. **Atomic Execution**: For each pending migration file:
   - Reads SQL file contents.
   - Wraps script execution and `_migrations` record insertion inside a single SQLite transaction (`db.transaction(...)`).
   - If SQL execution succeeds, commits the transaction and records `applied_at` timestamp.

## Related Concepts

* [Database Architecture](/knowledge/db/architecture.md)
* [Database Schemas](/knowledge/db/index.md#database-schemas-tables)
