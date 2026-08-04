---
type: SQLite Schema
title: Settings Database Schema
description: Table schema for global key-value settings.
resource: /src/db/migrations/028_settings.sql
tags: [database, schema, settings, sqlite]
sources:
  - id: migration-028
    resource: /src/db/migrations/028_settings.sql
    title: Add settings table
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Settings Schema

The settings table stores global application key-value configurations (e.g. `last_processed_period`).

## Table

### `settings`

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `key` | `TEXT` | `PRIMARY KEY` | Setting key identifier string. |
| `value` | `TEXT` | `NOT NULL` | Setting value payload string. |

## Related Concepts

* [Settings DB Module](/knowledge/db/modules/settings.md)
