---
type: UI Component
title: Money UI Components
description: UI components for recurring income/expense money flows and navigation.
resource: /src/components/money/
tags: [ui, money, flows, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Money UI Components

Money UI components manage income and expense money flows and navigation.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `FlowsPage.tsx` | Flows state | JSX.Element | Main money flows overview page. |
| `FlowsAdmin.tsx` | Flows list | JSX.Element | Administration view for money flows. |
| `FlowsForm.tsx` | Flow item | JSX.Element | Form for creating or updating money flows. |
| `MoneySubNav.tsx` | Active tab | JSX.Element | Navigation sub-bar for money modules. |

## Domain Logic & User Interaction

- Configure recurring income and expense flows.
- Track flow amounts, categories, and recurrence rules.

## Related Concepts

* [Money Flows Feature Module](/knowledge/features/modules/money.md)
* [Money Flows Data Access Module](/knowledge/db/modules/money_flows.md)
