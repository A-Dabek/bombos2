---
type: SQLite Schema
title: Groceries Database Schemas
description: Table schemas for groceries_items, groceries_product_counts, groceries_purchase_log, groceries_ingredient_aliases, and the per-shop aisle tables.
resource: /src/db/migrations/021_groceries.sql
tags: [database, schema, groceries, sqlite]
sources:
  - id: migration-021
    resource: /src/db/migrations/021_groceries.sql
    title: Initial groceries tables migration
  - id: migration-023
    resource: /src/db/migrations/023_add_groceries_amount_unit.sql
    title: Add amount and unit to groceries_items
  - id: migration-029
    resource: /src/db/migrations/029_groceries_stats.sql
    title: Add groceries_product_counts table
  - id: migration-032
    resource: /src/db/migrations/032_shops.sql
    title: Per-shop aisles (see ADR-034)
  - id: migration-034
    resource: /src/db/migrations/034_groceries_purchase_log.sql
    title: Add groceries_purchase_log table
  - id: migration-035
    resource: /src/db/migrations/035_groceries_ingredient_aliases.sql
    title: Add groceries_ingredient_aliases table
  - id: adr-035
    resource: /docs/adr-035-recipe-import.md
    title: Recipe screenshot import
generated: { by: agent:opencode, at: 2026-09-30T00:00:00Z }
status: stable
---

# Groceries Schemas

The groceries module manages shopping list items, purchase-frequency counters, a
purchase-event log for recency hints, ingredient aliases, and per-shop aisle
placement. (`category` was retired in favour of per-shop aisles — see
[ADR-034](/docs/adr-034-shop-scoped-groceries-aisles.md).)

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
  unit TEXT NOT NULL DEFAULT 'x'
);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique item ID. |
| `name` | `TEXT` | `NOT NULL` | Item product name. |
| `description` | `TEXT` | `NULL` | Optional notes/description (max 300 chars via API). |
| `urgent` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if high priority; 0 otherwise. |
| `bought` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if checked off; 0 if active. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Unix creation timestamp. |
| `amount` | `REAL` | `NOT NULL DEFAULT 1.0` | Quantity. |
| `unit` | `TEXT` | `NOT NULL DEFAULT 'x'` | One of `x`, `g`, `kg`, `l`, `ml`. |

The retired `category` column (migration `031`/`033`) is replaced by per-shop
placement in `groceries_item_aisles`.

---

### 2. `groceries_product_counts`

Total purchase occurrences per product for autocomplete/suggestions.

```sql
CREATE TABLE groceries_product_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    buy_count INTEGER NOT NULL DEFAULT 0
);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique ID. |
| `name` | `TEXT` | `NOT NULL` | Original display name (first one seen wins). |
| `normalized_name` | `TEXT` | `UNIQUE NOT NULL` | `normalizeProductName(name)`. |
| `buy_count` | `INTEGER` | `NOT NULL DEFAULT 0` | Times the item was cleared while bought. |

Stores no amount/unit — only a name and a count.

---

### 3. `groceries_purchase_log`

Append-only purchase-event log used for the recipe-import recency hint.

```sql
CREATE TABLE groceries_purchase_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  bought_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_purchase_log_norm ON groceries_purchase_log(normalized_name, bought_at DESC);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique ID. |
| `name` | `TEXT` | `NOT NULL` | Product name at purchase time. |
| `normalized_name` | `TEXT` | `NOT NULL` | `normalizeProductName(name)`. |
| `bought_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Event timestamp. |

A row is written by `logPurchase` inside `incrementGroceryItemCount`
(`src/db/groceries.ts`), i.e. when a bought item is **cleared** from the list —
the same event that increments `buy_count`.

---

### 4. `groceries_ingredient_aliases`

Maps noisy ingredient names to a canonical product name for import.

```sql
CREATE TABLE groceries_ingredient_aliases (
  normalized_alias TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

| Column | Type | Constraints | Description |
|---|---|---|---|
| `normalized_alias` | `TEXT` | `PRIMARY KEY` | `normalizeProductName(alias)`. |
| `canonical_name` | `TEXT` | `NOT NULL` | Target display name. |
| `updated_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Last write time. |

Separate from `normalizeProductName` (which is persisted in other tables and must
not change). Learned only for already-known products — see
[ADR-035](/docs/adr-035-recipe-import.md).

---

### 5. Per-shop aisle tables

`shops`, `shop_aisles`, `groceries_item_aisles`, `groceries_product_aisles`, and
`groceries_completed_aisles` model where each product lives, per shop. See
[ADR-034](/docs/adr-034-shop-scoped-groceries-aisles.md) and
`src/db/migrations/032_shops.sql`.

## Related Concepts

* [Groceries DB Module](/knowledge/db/modules/groceries.md)
* [Recipe Import (ADR-035)](/docs/adr-035-recipe-import.md)
