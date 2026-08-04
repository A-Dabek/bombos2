---
type: UI Component
title: Groceries UI Components
description: UI components for grocery planning, shopping lists, category filtering, and item management.
resource: /src/components/groceries/
tags: [ui, groceries, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Groceries UI Components

Groceries UI components support grocery planning view, shopping list execution, category filtering, and item row management.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `ShoppingList.tsx` | Items, categories | JSX.Element | Active shopping list view grouped by category. |
| `ShoppingCategoryGroup.tsx` | Category items | JSX.Element | Group of items under a specific product category. |
| `ShoppingListItem.tsx` | Item data | JSX.Element | Individual grocery shopping item with check/uncheck toggle. |
| `PlanningFormView.tsx` | Planning form state | JSX.Element | Form for adding or editing planned grocery items. |
| `PlanningItemsView.tsx` | Planned items | JSX.Element | List view of planned items with buy counts and suggestions. |
| `CategoryFilter.tsx` | Categories, selected | JSX.Element | Category filter bar for grocery items. |
| `GroceriesSubNav.tsx` | Active tab | JSX.Element | Navigation between Planning and Shopping modes. |

## Domain Logic & User Interaction

- Switch between Planning mode and Shopping mode.
- Category grouping with quick completion toggles.
- Auto-suggestion support based on frequent product counts.

## Related Concepts

* [Groceries Feature Module](/knowledge/features/modules/groceries.md)
* [Groceries Data Access Module](/knowledge/db/modules/groceries.md)
