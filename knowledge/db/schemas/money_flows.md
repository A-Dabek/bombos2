---
type: SQLite Schema
title: Money Flows Database Schema
description: Table schema for money_flows.
resource: /src/db/migrations/027_money_flows.sql
tags: [database, schema, money_flows, sqlite]
sources:
  - id: migration-027
    resource: /src/db/migrations/027_money_flows.sql
    title: Add money_flows table
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Money Flows Schema

The money flows table stores recurring automated cash flow rules triggered on specific days of the month.

## Table

### `money_flows`

```sql
CREATE TABLE money_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique money flow ID. |
| `description` | `TEXT` | `NOT NULL` | Label describing the money flow. |
| `amount` | `INTEGER` | `NOT NULL` | Flow value amount. |
| `day_of_month` | `INTEGER` | `NOT NULL` | Scheduled day of month when flow triggers. |
| `created_at` | `INTEGER` | `NOT NULL DEFAULT (unixepoch())` | Creation timestamp. |

## Related Concepts

* [Flows DB Module](/knowledge/db/modules/flows.md)
