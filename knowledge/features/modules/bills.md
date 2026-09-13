---
type: Feature Module
title: Bills Feature Module
description: High-level specification for monthly bills tracking, automatic payments, and predefined templates.
resource: /src/components/bills/BillsPage.tsx
tags: [feature, bills, payments, automation]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Bills Feature Module

The Bills feature manages monthly bill tracking, automatic recurring payments, predefined payment templates, and transaction history.

## Core Capabilities & Workflows

1. **Bills Tracking**: Track bill amounts, due dates, and payment statuses.
2. **Automatic Payments**: Manage automatic recurring bill execution rules.
3. **Predefined Templates**: Utilize predefined billing templates for quick entry.
4. **Automatic Aggregation (ADR-032)**: Automatic payments of a period are summed server-side into a single "Stałe opłaty" row shown last in the month; a "Rozwiń (N)" button below it lazily expands the individual automatic payments for that month only. Each month expands independently.

## Related Concepts

* [Bills UI Components](/knowledge/ui/components/bills.md)
* [Bills Data Access Module](/knowledge/db/modules/bills.md)
* [Bills Schemas](/knowledge/db/schemas/bills.md)
