---
type: SQLite Schema
title: Plan Database Schemas
description: Table schemas for plan_lists and plan_items with cascading foreign keys.
resource: /src/db/migrations/008_plan.sql
tags: [database, schema, plan, tasklist, sqlite]
sources:
  - id: migration-008
    resource: /src/db/migrations/008_plan.sql
    title: Initial plan tables migration
  - id: migration-009
    resource: /src/db/migrations/009_plan_seed.sql
    title: Seed initial plan lists and items
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Plan Schemas

The plan module manages task lists (`plan_lists`) and individual task items (`plan_items`).

## Tables

### 1. `plan_lists`

Lists/categories for organizing task plan items.

```sql
CREATE TABLE plan_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique list ID. |
| `title` | `TEXT` | `NOT NULL` | List display title. |
| `display_order` | `INTEGER` | `NOT NULL DEFAULT 0` | Display sorting order index. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Unix creation timestamp. |

---

### 2. `plan_items`

Individual action items associated with a parent list.

```sql
CREATE TABLE plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (list_id) REFERENCES plan_lists(id) ON DELETE CASCADE
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique plan item ID. |
| `list_id` | `INTEGER` | `NOT NULL, FK -> plan_lists(id) ON DELETE CASCADE` | Parent list reference. |
| `name` | `TEXT` | `NOT NULL` | Item title or short summary. |
| `description` | `TEXT` | `NULL` | Optional detailed description. |
| `urgent` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if high priority/urgent; 0 otherwise. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (strftime('%s', 'now'))` | Unix creation timestamp in seconds. |

## Related Concepts

* [Plan DB Module](/knowledge/db/modules/plan.md)
