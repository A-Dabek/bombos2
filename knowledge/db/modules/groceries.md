---
type: Data Access Module
title: Groceries DB Module
description: Data access functions for grocery shopping list items, category auto-classification, purchase counters, and completed category UI state.
resource: /src/db/groceries.ts
tags: [database, data-access, groceries, typescript]
sources:
  - id: groceries-module
    resource: /src/db/groceries.ts
    title: Groceries data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Groceries DB Module

Module `/src/db/groceries.ts` manages grocery list items, automatic category learning/matching, purchase frequency counters, and section completion state.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getGroceryItems(db?)` | `db?: Database` | `GroceryItem[]` | Fetches active and bought grocery items ordered by creation date. |
| `getGroceryItemById(id, db?)` | `id: number, db?: Database` | `GroceryItem \| null` | Fetches single grocery item by ID. |
| `createGroceryItem(item, db?)` | `item: CreateGroceryItemInput, db?: Database` | `GroceryItem` | Creates item, auto-suggests category if omitted, and saves product category mapping. |
| `updateGroceryItem(id, item, db?)` | `id: number, item: Partial<...>, db?: Database` | `GroceryItem` | Updates grocery item details. |
| `setGroceryItemBought(id, bought, db?)` | `id: number, bought: boolean, db?: Database` | `GroceryItem` | Toggles item bought state; increments purchase count if marked bought. |
| `updateGroceryItemAmount(id, amount, unit, db?)` | `id: number, amount: number, unit: string, db?: Database` | `GroceryItem` | Updates item quantity and unit. |
| `deleteGroceryItem(id, db?)` | `id: number, db?: Database` | `boolean` | Deletes single grocery item. |
| `deleteAllGroceryItems(db?)` | `db?: Database` | `void` | Deletes all items from grocery list. |
| `deleteBoughtGroceryItems(db?)` | `db?: Database` | `void` | Clears all items marked as bought. |
| `getCompletedCategories(db?)` | `db?: Database` | `string[]` | Fetches list of completed/collapsed category strings. |
| `setCategoryCompleted(category, completed, db?)` | `category: string, completed: boolean, db?: Database` | `void` | Toggles completed state for a category section. |
| `clearCompletedCategories(db?)` | `db?: Database` | `void` | Clears all completed category section states. |
| `getSuggestedCategory(name, db?)` | `name: string, db?: Database` | `string \| null` | Resolves learned category for product name via normalized lookup. |
| `saveProductCategory(name, category, db?)` | `name: string, category: string, db?: Database` | `void` | Upserts learned default category mapping for normalized product name. |
| `incrementGroceryItemCount(name, db?)` | `name: string, db?: Database` | `void` | Increments total buy counter for product. |
| `getTopGrocerySuggestions(limit?, db?)` | `limit?: number, db?: Database` | `GrocerySuggestion[]` | Fetches most frequently bought products for smart UI autocomplete. |

## Category & Autocomplete Learning

When new items are created or edited:
1. `saveProductCategory` lowercases and normalizes the product name, linking it to the specified category.
2. `getSuggestedCategory` uses this lookup table to automatically pre-assign categories to new items.
3. Marking items as bought increments `buy_count` in `groceries_product_counts`, powering `getTopGrocerySuggestions`.

## Related Concepts

* [Groceries Schemas](/knowledge/db/schemas/groceries.md)
* [Database Architecture](/knowledge/db/architecture.md)
