---
type: SQLite Schema
title: Meals Database Schema
description: Table schema for meals.
resource: /src/db/migrations/005_meals.sql
tags: [database, schema, meals, sqlite]
sources:
  - id: migration-005
    resource: /src/db/migrations/005_meals.sql
    title: Initial meals table migration
  - id: migration-006
    resource: /src/db/migrations/006_meals_seed.sql
    title: Initial meals seed data
  - id: migration-007
    resource: /src/db/migrations/007_remove_breakfast.sql
    title: Remove breakfast category constraint
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Meals Schema

The meals table stores meal suggestions categorized by meal type (`dinner`, `supper`).

## Table

### `meals`

```sql
CREATE TABLE meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('dinner', 'supper')),
  name TEXT NOT NULL
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique meal entry ID. |
| `category` | `TEXT` | `NOT NULL CHECK(category IN ('dinner', 'supper'))` | Meal type category constraint. |
| `name` | `TEXT` | `NOT NULL` | Meal name or recipe title. |

## Related Concepts

* [Meals DB Module](/knowledge/db/modules/meals.md)
