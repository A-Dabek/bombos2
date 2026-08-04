---
type: Data Access Module
title: Balance DB Module
description: Data access functions for bank balance tracking, transactions, period start calculations, and period grouping.
resource: /src/db/balance.ts
tags: [database, data-access, balance, typescript]
sources:
  - id: balance-module
    resource: /src/db/balance.ts
    title: Balance data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Balance DB Module

Module `/src/db/balance.ts` manages bank/account balance configuration, transaction history, period grouping, and automatic period start entry generation.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getBalanceConfig(db?)` | `db?: Database` | `BalanceConfig` | Fetches singleton balance configuration (`day_of_month`). Defaults to 15. |
| `updateBalanceConfig(dayOfMonth, db?)` | `dayOfMonth: number, db?: Database` | `BalanceConfig` | Updates balance period start day of month. |
| `addBalanceTransaction(description, amount, isAutomatic?, db?)` | `description: string, amount: number, isAutomatic?: boolean, db?: Database` | `BalanceTransaction` | Creates manual or automatic balance transaction. |
| `getBalanceTransactions(db?)` | `db?: Database` | `BalanceTransaction[]` | Fetches all balance transactions ordered by creation date desc. |
| `getBalanceTransactionsGroupedByPeriod(db?)` | `db?: Database` | `BalancePeriodGroup[]` | Groups transactions into billing periods with period totals and opening balances. |
| `shouldAddBalancePeriodStart(now?, db?)` | `now?: Date, db?: Database` | `boolean` | Checks if balance period rollover entry is due for current billing cycle. |
| `addPeriodStartTransaction(now?, db?)` | `now?: Date, db?: Database` | `BalanceTransaction` | Inserts period start transaction carrying previous period's ending balance. |
| `runBalancePeriodStart(now?, db?)` | `now?: Date, db?: Database` | `void` | Triggers period start transaction if `shouldAddBalancePeriodStart` is true. |

## Period Rollover Logic

At the beginning of each billing period (on `day_of_month`), `runBalancePeriodStart` creates a period start transaction carrying over the ending balance of the previous period.

## Related Concepts

* [Balance Schemas](/knowledge/db/schemas/balance.md)
* [Database Architecture](/knowledge/db/architecture.md)
