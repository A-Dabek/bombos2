---
type: Data Access Module
title: Flows DB Module
description: Data access functions for managing recurring scheduled money flow rules.
resource: /src/db/flows.ts
tags: [database, data-access, money-flows, typescript]
sources:
  - id: flows-module
    resource: /src/db/flows.ts
    title: Flows data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Flows DB Module

Module `/src/db/flows.ts` provides CRUD operations for managing recurring automated cash flows scheduled for specific days of the month.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getMoneyFlows(db?)` | `db?: Database` | `MoneyFlow[]` | Fetches all configured money flows ordered by `day_of_month` ascending. |
| `getMoneyFlow(id, db?)` | `id: number, db?: Database` | `MoneyFlow \| null` | Fetches single money flow rule by ID. |
| `addMoneyFlow(description, amount, dayOfMonth, db?)` | `description: string, amount: number, dayOfMonth: number, db?: Database` | `MoneyFlow` | Creates new recurring money flow record. |
| `updateMoneyFlow(id, description, amount, dayOfMonth, db?)` | `id: number, description: string, amount: number, dayOfMonth: number, db?: Database` | `MoneyFlow` | Updates existing money flow details. |
| `deleteMoneyFlow(id, db?)` | `id: number, db?: Database` | `boolean` | Deletes money flow record by ID. |

## Related Concepts

* [Money Flows Schema](/knowledge/db/schemas/money_flows.md)
* [Database Architecture](/knowledge/db/architecture.md)
