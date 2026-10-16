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
| `admin/GroceriesAdmin.tsx` | (none) | JSX.Element | Merge-duplicates admin view (`/groceries/admin`): search field, all-products results list, staged selection list above with per-row remove, click-to-set target, two-click confirm, success/error feedback and Loader/empty states. |

## Merge Duplicates Admin (`/groceries/admin`)

`GroceriesAdmin` loads `GET /api/groceries/admin` and renders candidates with
`data-testid="groceries-admin"`. The entry point is the floating `AdminButton`
on `/groceries/planning`.

- Staged selection list (above the search field) holds chosen names; rows are
  `admin-merge-staged-row` + `data-name` and each has a remove control
  (`admin-merge-remove-<normalized>`). Clicking a staged row sets the target
  (`admin-merge-staged-select-<normalized>`, marked by
  `admin-merge-target-badge`).
- The first added item becomes the target automatically; removing the target
  falls back to the next staged row.
- The search field (`admin-merge-search`) filters the all-products results list
  (`admin-merge-result-row` + `data-name`); clicking a result stages it. Results
  exclude already-staged names.
- `admin-merge-submit` is a two-click button (arms red for 2s, then confirms)
  and posts `{ target, sources }`, enabled once at least two items are staged.
- Success renders `admin-merge-success`; failures render `admin-merge-error`.
- All row markup is inline (no child `component$`) so array replacement
  re-renders correctly.

## Domain Logic & User Interaction

- Switch between Planning mode and Shopping mode.
- Category grouping with quick completion toggles.
- Auto-suggestion support based on frequent product counts.

## Related Concepts

* [Groceries Feature Module](/knowledge/features/modules/groceries.md)
* [Groceries Data Access Module](/knowledge/db/modules/groceries.md)
