---
type: SQLite Schema
title: Balance Database Schemas
description: Table schemas for balance_config and balance_transactions.
resource: /src/db/migrations/014_balance.sql
tags: [database, schema, balance, sqlite]
sources:
  - id: migration-014
    resource: /src/db/migrations/014_balance.sql
    title: Initial balance tables migration
  - id: migration-016
    resource: /src/db/migrations/016_add_is_automatic_balance.sql
    title: Add is_automatic to balance_transactions
  - id: migration-021-import
    resource: /src/db/migrations/021_import_historical_balance_transactions.sql
    title: Historical balance transactions import
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Balance Schemas

The balance module tracks bank/account balance transactions and period start configuration.

## Tables

### 1. `balance_config`

Singleton configuration table storing the balance billing period day of month.

```sql
CREATE TABLE balance_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY CHECK (id = 1)` | Singleton row identifier. Always 1. |
| `day_of_month` | `INTEGER` | `NOT NULL DEFAULT 15` | Day of month when new balance period starts. |

---

### 2. `balance_transactions`

Log of manual and automatic balance transactions.

```sql
CREATE TABLE balance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_automatic INTEGER NOT NULL DEFAULT 0
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique transaction ID. |
| `description` | `TEXT` | `NOT NULL` | Description or label of balance transaction. |
| `amount` | `INTEGER` | `NOT NULL` | Transaction amount. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Unix timestamp (seconds). |
| `is_automatic` | `INTEGER` | `NOT NULL DEFAULT 0` | 1 if created automatically during period start; 0 if manual entry. |

## Related Concepts

* [Balance DB Module](/knowledge/db/modules/balance.md)
