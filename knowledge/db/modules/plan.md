---
type: Data Access Module
title: Plan DB Module
description: Data access functions for managing task list structures, plan items, display ordering, and urgency checks.
resource: /src/db/plan.ts
tags: [database, data-access, plan, tasklist, typescript]
sources:
  - id: plan-module
    resource: /src/db/plan.ts
    title: Plan data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Plan DB Module

Module `/src/db/plan.ts` handles task planning list categories (`plan_lists`) and nested task items (`plan_items`).

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getPlanLists(db?)` | `db?: Database` | `PlanList[]` | Fetches all plan lists ordered by `display_order` ascending. |
| `getPlanListById(id, db?)` | `id: number, db?: Database` | `PlanList \| null` | Fetches single plan list by ID. |
| `createPlanList(title, db?)` | `title: string, db?: Database` | `PlanList` | Creates new task list category. |
| `updatePlanListOrder(orders, db?)` | `orders: { id: number, display_order: number }[], db?: Database` | `void` | Updates sorting order of lists in batch transaction. |
| `deletePlanList(id, db?)` | `id: number, db?: Database` | `boolean` | Deletes task list and cascades deletion to child items. |
| `getPlanItems(listId, db?)` | `listId: number, db?: Database` | `PlanItem[]` | Fetches all task items belonging to a list. |
| `getPlanItemById(id, db?)` | `id: number, db?: Database` | `PlanItem \| null` | Fetches single plan item by ID. |
| `createPlanItem(listId, name, description?, urgent?, db?)` | `listId: number, name: string, description?: string, urgent?: boolean, db?: Database` | `PlanItem` | Creates action item under parent list. |
| `updatePlanItem(id, item, db?)` | `id: number, item: Partial<...>, db?: Database` | `PlanItem` | Updates name, description, or urgency of item. |
| `deletePlanItem(id, db?)` | `id: number, db?: Database` | `boolean` | Deletes single plan item. |
| `deleteAllPlanItems(listId, db?)` | `listId: number, db?: Database` | `void` | Clears all plan items from a specific list. |
| `hasUrgentPlanItems(db?)` | `db?: Database` | `boolean` | Checks if any active plan item across all lists is marked urgent. |

## Related Concepts

* [Plan Schemas](/knowledge/db/schemas/plan.md)
* [Database Architecture](/knowledge/db/architecture.md)
