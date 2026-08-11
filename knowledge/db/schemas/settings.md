---
type: SQLite Schema
title: Settings Database Schema
description: Table schema for per-account and global key-value settings.
resource: /src/db/migrations/030_settings_user_dimension.sql
tags: [database, schema, settings, sqlite]
sources:
  - id: migration-028
    resource: /src/db/migrations/028_settings.sql
    title: Add settings table
  - id: migration-030
    resource: /src/db/migrations/030_settings_user_dimension.sql
    title: Add user_email dimension to settings
generated: { by: agent:junie, at: 2026-08-11T06:00:00Z }
status: stable
---

# Settings Schema

The settings table stores global and account-specific key-value configurations (e.g. `hidden_tabs`, `last_processed_period`).

## Table

### `settings`

```sql
CREATE TABLE settings (
  key TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT 'default',
  value TEXT NOT NULL,
  PRIMARY KEY (key, user_email)
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `key` | `TEXT` | `NOT NULL` | Setting key identifier string (part of primary key). |
| `user_email` | `TEXT` | `NOT NULL`, `DEFAULT 'default'` | User account email dimension (part of primary key). |
| `value` | `TEXT` | `NOT NULL` | Setting value payload string. |

## Related Concepts

* [Settings DB Module](/knowledge/db/modules/settings.md)
