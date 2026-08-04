---
type: UI Component
title: Bills UI Components
description: UI components for managing bills, automatic payments, predefined payments, and transactions.
resource: /src/components/bills/
tags: [ui, bills, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Bills UI Components

Bills UI components provide comprehensive billing management, automated payments, and transaction forms.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `BillsPage.tsx` | Bills state | JSX.Element | Main bills tracking and overview page. |
| `BillsAdmin.tsx` | Admin state | JSX.Element | Administration view for bills configuration. |
| `AutomaticPaymentsAdmin.tsx` | Auto payments | JSX.Element | Management view for automatic recurring payments. |
| `AutomaticPaymentItem.tsx` | Auto payment item | JSX.Element | Individual automatic payment row. |
| `PredefinedPaymentsAdmin.tsx` | Predefined items | JSX.Element | Management view for predefined bill templates. |
| `BillsTransactionForm.tsx` | Transaction form | JSX.Element | Form for recording bill transactions. |

## Domain Logic & User Interaction

- Track monthly bills and payment statuses.
- Configure automatic payments and predefined templates.
- Record and manage bill transactions.

## Related Concepts

* [Bills Feature Module](/knowledge/features/modules/bills.md)
* [Bills Data Access Module](/knowledge/db/modules/bills.md)
