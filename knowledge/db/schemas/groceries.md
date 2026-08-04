---
type: SQLite Schema
title: Groceries Database Schemas
description: Table schemas for groceries_items, groceries_product_categories, groceries_product_counts, and groceries_completed_categories.
resource: /src/db/migrations/021_groceries.sql
tags: [database, schema, groceries, sqlite]
sources:
  - id: migration-021
    resource: /src/db/migrations/021_groceries.sql
    title: Initial groceries tables migration
  - id: migration-023
    resource: /src/db/migrations/023_add_groceries_amount_unit.sql
    title: Add amount and unit to groceries_items
  - id: migration-024
    resource: /src/db/migrations/024_groceries_categories.sql
    title: Add groceries_product_categories table
  - id: migration-025
    resource: /src/db/migrations/025_groceries_completed_categories.sql
    title: Add groceries_completed_categories table
  - id: migration-029
    resource: /src/db/migrations/029_groceries_stats.sql
    title: Add groceries_product_counts table
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Groceries Schemas

The groceries module manages shopping list items, product category mappings, autocomplete purchase frequency counters, and completed category tracking.

## Tables

### 1. `groceries_items`

Active and bought grocery shopping list items.

```sql
CREATE TABLE groceries_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  bought INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  amount REAL NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'x',
  category TEXT
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique item ID. |
| `name` | `TEXT` | `NOT NULL` | Item product name. |
| `description` | `TEXT` | `NULL` | Optional item notes/description. |
| `urgent` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if high priority/urgent; 0 otherwise. |
| `bought` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if checked off/purchased; 0 if active on list. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Unix creation timestamp. |
| `amount` | `REAL` | `NOT NULL DEFAULT 1.0` | Quantity (number/weight). |
| `unit` | `TEXT` | `NOT NULL DEFAULT 'x'` | Measurement unit (e.g. `x`, `kg`, `g`, `l`, `ml`, `pack`). |
| `category` | `TEXT` | `NULL` | Assigned category label (e.g., Produce, Dairy, Bakery). |

---

### 2. `groceries_product_categories`

Normalizes product names to store learned category defaults for automatic classification.

```sql
CREATE TABLE groceries_product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique ID. |
| `normalized_name` | `TEXT` | `UNIQUE NOT NULL` | Lowercased, trimmed product name key. |
| `category` | `TEXT` | `NOT NULL` | Associated default category. |

---

### 3. `groceries_product_counts`

Tracks total purchase occurrences per product for smart autocomplete and suggestions.

```sql
CREATE TABLE groceries_product_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    buy_count INTEGER NOT NULL DEFAULT 0
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique ID. |
| `name` | `TEXT` | `NOT NULL` | Original product display name. |
| `normalized_name` | `TEXT` | `UNIQUE NOT NULL` | Unique normalized name key. |
| `buy_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Total number of times item was marked bought. |

---

### 4. `groceries_completed_categories`

Tracks category sections collapsed/completed by the user in the UI.

```sql
CREATE TABLE groceries_completed_categories (
    category TEXT PRIMARY KEY
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `category` | `TEXT` | `PRIMARY KEY` | Category name string currently marked completed. |

## Related Concepts

* [Groceries DB Module](/knowledge/db/modules/groceries.md)
