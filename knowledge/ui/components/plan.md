---
type: UI Component
title: Plan UI Components
description: UI components for planning lists, accordion views, forms, and items.
resource: /src/components/plan/
tags: [ui, plan, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Plan UI Components

Plan UI components manage task lists, planning forms, and accordion-based list displays.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `PlanLists.tsx` | Plan lists | JSX.Element | Overview container for plan lists. |
| `PlanAccordionList.tsx` | List items | JSX.Element | Accordion collapsible view for plan categories/items. |
| `PlanAdmin.tsx` | Admin state | JSX.Element | Administration view for plan lists and items. |
| `PlanForm.tsx` | Plan form state | JSX.Element | Form for creating or editing plan items. |
| `PlanItemRow.tsx` | Plan item | JSX.Element | Individual plan item row with completion toggle. |

## Domain Logic & User Interaction

- Organize tasks and plans into lists and accordions.
- Add, edit, and toggle completion state of plan items.

## Related Concepts

* [Plan Feature Module](/knowledge/features/modules/plan.md)
* [Plan Data Access Module](/knowledge/db/modules/plan.md)
