---
type: UI Component
title: Allowance UI Components
description: UI components for allowance configuration and transaction tracking.
resource: /src/components/allowance/
tags: [ui, allowance, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Allowance UI Components

Allowance UI components provide allowance configuration and transaction history viewing.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `AllowancePage.tsx` | Allowance state | JSX.Element | Main allowance dashboard page. |
| `AllowanceAdmin.tsx` | Config data | JSX.Element | Admin view for configuring allowance amounts and periods. |
| `AllowanceTransactionGroup.tsx` | Transactions | JSX.Element | Grouped transaction list by date or period. |
| `AllowanceTransactionLine.tsx` | Transaction | JSX.Element | Individual allowance transaction row. |

## Domain Logic & User Interaction

- Configure periodic allowance amounts and tracking.
- View transaction history grouped by period.

## Related Concepts

* [Allowance Feature Module](/knowledge/features/modules/allowance.md)
* [Allowance Data Access Module](/knowledge/db/modules/allowance.md)
