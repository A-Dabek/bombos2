---
type: SQLite Schema
title: Allowance Database Schemas
description: Table schemas for allowance_config and allowance_transactions.
resource: /src/db/migrations/010_allowance.sql
tags: [database, schema, allowance, sqlite]
sources:
  - id: migration-010
    resource: /src/db/migrations/010_allowance.sql
    title: Initial allowance tables migration
  - id: migration-011
    resource: /src/db/migrations/011_add_is_automatic.sql
    title: Add is_automatic to allowance_transactions
  - id: migration-012
    resource: /src/db/migrations/012_drop_allowance_config_updated_at.sql
    title: Drop updated_at from allowance_config
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Allowance Schemas

The allowance module manages monthly allowance settings and transaction logs.

## Tables

### 1. `allowance_config`

Singleton configuration table storing the allowance reset day of month and monthly allowance amount.

```sql
CREATE TABLE "allowance_config" (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15,
  monthly_amount INTEGER NOT NULL DEFAULT 600
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY CHECK (id = 1)` | Singleton enforcement constraint. Always 1. |
| `day_of_month` | `INTEGER` | `NOT NULL DEFAULT 15` | Day of the month when new allowance period starts. |
| `monthly_amount` | `INTEGER` | `NOT NULL DEFAULT 600` | Monthly target allowance amount. |

---

### 2. `allowance_transactions`

Log of transactions (allowance additions, expenses, income) impacting allowance balance.

```sql
CREATE TABLE allowance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('allowance', 'expense', 'income')),
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_automatic INTEGER DEFAULT 0
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique transaction ID. |
| `type` | `TEXT` | `NOT NULL CHECK (type IN ('allowance', 'expense', 'income'))` | Transaction category. |
| `description` | `TEXT` | `NOT NULL` | Description of allowance movement. |
| `amount` | `INTEGER` | `NOT NULL` | Signed integer amount. |
| `balance_after` | `INTEGER` | `NOT NULL` | Balance snapshot after this transaction was applied. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Unix timestamp (seconds). |
| `is_automatic` | `INTEGER` | `DEFAULT 0` | 1 if created automatically during period start rollover; 0 if manual. |

## Related Concepts

* [Allowance DB Module](/knowledge/db/modules/allowance.md)
