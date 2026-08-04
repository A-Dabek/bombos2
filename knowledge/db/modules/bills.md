---
type: Data Access Module
title: Bills DB Module
description: Data access functions for managing bills configuration, automatic recurring payments, predefined payment templates, urgency status, and transactions.
resource: /src/db/bills.ts
tags: [database, data-access, bills, typescript]
sources:
  - id: bills-module
    resource: /src/db/bills.ts
    title: Bills data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Bills DB Module

Module `/src/db/bills.ts` handles bill payment transactions, billing cycle period start rollovers, automatic monthly payment rules, predefined bill payment templates, and bill urgency status calculations.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getBillsConfig(db?)` | `db?: Database` | `BillsConfig` | Fetches singleton bills configuration (`day_of_month`). Defaults to 15. |
| `updateBillsConfig(dayOfMonth, db?)` | `dayOfMonth: number, db?: Database` | `BillsConfig` | Updates reset day of month for bills cycle. |
| `addBillTransaction(description, amount, options?, db?)` | `description: string, amount: number, options?, db?: Database` | `BillTransaction` | Records paid bill transaction with optional `isAutomatic` and `predefinedSlug`. |
| `getBillTransactions(db?)` | `db?: Database` | `BillTransaction[]` | Fetches list of all bill transactions. |
| `getBillTransactionsGroupedByPeriod(db?)` | `db?: Database` | `BillPeriodGroup[]` | Groups bill transactions into period cycles with totals. |
| `shouldAddBillsPeriodStart(now?, db?)` | `now?: Date, db?: Database` | `boolean` | Checks if bills period rollover is pending. |
| `runBillsPeriodStart(now?, db?)` | `now?: Date, db?: Database` | `void` | Executes period start rollover and automatic recurring bill payments. |
| `getBillsAutomaticPayments(db?)` | `db?: Database` | `BillsAutomaticPayment[]` | Lists configured automatic recurring monthly bill payments. |
| `addBillsAutomaticPayment(name, amount, db?)` | `name: string, amount: number, db?: Database` | `BillsAutomaticPayment` | Creates new automatic recurring bill payment rule. |
| `deleteBillsAutomaticPayment(id, db?)` | `id: number, db?: Database` | `boolean` | Deletes automatic recurring bill payment rule. |
| `getBillsPredefinedPayments(db?)` | `db?: Database` | `BillsPredefinedPayment[]` | Fetches predefined payment templates. |
| `addBillsPredefinedPayment(name, db?)` | `name: string, db?: Database` | `BillsPredefinedPayment` | Adds new predefined bill template. |
| `deleteBillsPredefinedPayment(id, db?)` | `id: number, db?: Database` | `boolean` | Removes predefined bill template. |
| `isBillsUrgent(now?, db?)` | `now?: Date, db?: Database` | `boolean` | Calculates if unpaid bills exist near period start deadline. |

## Urgency Logic (`isBillsUrgent`)

Calculates whether unpaid bills require urgent attention. If current date is within deadline threshold (e.g. 3 days before `day_of_month`), and expected automatic/predefined payments remain unpaid for the active period, returns `true`.

## Related Concepts

* [Bills Schemas](/knowledge/db/schemas/bills.md)
* [Database Architecture](/knowledge/db/architecture.md)
