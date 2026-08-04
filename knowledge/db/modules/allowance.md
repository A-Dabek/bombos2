---
type: Data Access Module
title: Allowance DB Module
description: Data access functions for managing monthly allowance configuration, transactions, period start calculations, and balance tracking.
resource: /src/db/allowance.ts
tags: [database, data-access, allowance, typescript]
sources:
  - id: allowance-module
    resource: /src/db/allowance.ts
    title: Allowance data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Allowance DB Module

Module `/src/db/allowance.ts` provides data access functions for allowance configuration, transaction recording, balance calculation, and monthly period rollover execution.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getAllowanceConfig(db?)` | `db?: Database` | `AllowanceConfig` | Fetches singleton allowance configuration (`day_of_month`, `monthly_amount`). Defaults to day 15, 600 amount. |
| `updateAllowanceConfig(dayOfMonth, amount, db?)` | `dayOfMonth: number, amount: number, db?: Database` | `AllowanceConfig` | Updates singleton allowance configuration values. |
| `getCurrentBalance(db?)` | `db?: Database` | `number` | Returns latest calculated balance snapshot from `allowance_transactions`. |
| `getTransactionsGroupedByPeriod(db?)` | `db?: Database` | `PeriodGroup[]` | Groups allowance transactions by billing month period based on `day_of_month`. |
| `addAllowanceTransaction(type, description, amount, isAutomatic?, db?)` | `type: AllowanceType, description: string, amount: number, isAutomatic?: boolean, db?: Database` | `AllowanceTransaction` | Inserts transaction and computes new `balance_after`. |
| `deleteLastTransaction(db?)` | `db?: Database` | `boolean` | Deletes the most recent allowance transaction by ID. |
| `shouldAddAllowance(now?, db?)` | `now?: Date, db?: Database` | `boolean` | Determines if new monthly allowance rollover is due based on current date and last automatic transaction. |
| `runAllowance(now?, db?)` | `now?: Date, db?: Database` | `void` | Automatically adds new allowance transaction if `shouldAddAllowance` evaluates to true. |

## Period Rollover Logic

The allowance period resets monthly on `day_of_month`. Transactions created on or after `day_of_month` belong to the upcoming period cycle. `runAllowance` checks if an automatic allowance transaction has already been posted for the current active period; if missing, it creates one.

## Related Concepts

* [Allowance Schemas](/knowledge/db/schemas/allowance.md)
* [Database Architecture](/knowledge/db/architecture.md)
