---
type: SQLite Schema
title: Bills Database Schemas
description: Table schemas for bills_config, bills_transactions, bills_automatic_payments, and bills_predefined_payments.
resource: /src/db/migrations/013_bills.sql
tags: [database, schema, bills, sqlite]
sources:
  - id: migration-013
    resource: /src/db/migrations/013_bills.sql
    title: Initial bills tables migration
  - id: migration-015
    resource: /src/db/migrations/015_add_is_automatic_bills.sql
    title: Add is_automatic to bills_transactions
  - id: migration-018
    resource: /src/db/migrations/018_add_bills_automatic_payments.sql
    title: Add bills_automatic_payments table
  - id: migration-019
    resource: /src/db/migrations/019_add_predefined_payments.sql
    title: Add bills_predefined_payments table
  - id: migration-020
    resource: /src/db/migrations/020_add_predefined_slug_to_transactions.sql
    title: Add predefined_slug to bills_transactions
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Bills Schemas

The bills module manages billing cycle configurations, recurring automatic payments, predefined payment templates, and transaction history.

## Tables

### 1. `bills_config`

Singleton configuration table for bills billing period.

```sql
CREATE TABLE bills_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY CHECK (id = 1)` | Singleton identifier. Always 1. |
| `day_of_month` | `INTEGER` | `NOT NULL DEFAULT 15` | Reset day of month for bills period. |

---

### 2. `bills_transactions`

Log of paid bills and automatic/predefined bill transactions.

```sql
CREATE TABLE bills_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_automatic INTEGER NOT NULL DEFAULT 0,
  predefined_slug TEXT
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique transaction ID. |
| `description` | `TEXT` | `NOT NULL` | Description of bill transaction. |
| `amount` | `INTEGER` | `NOT NULL` | Amount of bill payment. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Unix timestamp (seconds). |
| `is_automatic` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if payment was executed automatically during period rollover. |
| `predefined_slug` | `TEXT` | `NULL` | Optional reference slug linking to a predefined payment template. |

---

### 3. `bills_automatic_payments`

Configured automatic monthly recurring bills (e.g. rent, electricity).

```sql
CREATE TABLE bills_automatic_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique ID. |
| `name` | `TEXT` | `NOT NULL` | Display name of automatic bill. |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | Unique identifier slug. |
| `amount` | `INTEGER` | `NOT NULL` | Standard transaction amount. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Creation timestamp. |

---

### 4. `bills_predefined_payments`

Predefined bill payment templates for quick manual entry.

```sql
CREATE TABLE bills_predefined_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique ID. |
| `name` | `TEXT` | `NOT NULL` | Template display name. |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | Unique template slug. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Creation timestamp. |

## Related Concepts

* [Bills DB Module](/knowledge/db/modules/bills.md)
