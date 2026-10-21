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

## Merge Duplicates Module (`/src/db/groceries-merge.ts`)

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `listMergeCandidates(db?)` | `db?: Database` | `MergeCandidate[]` | Union of `groceries_product_counts`, distinct `groceries_items.name`, and distinct `groceries_ingredient_aliases.canonical_name`, deduped by `normalizeProductName`. Display-name preference is counts > items > alias canonical; `buyCount` comes from the counts row (else 0), `onList` is true when the normalized name is on the list. Sorted alphabetically via `name.localeCompare(..., "pl", { sensitivity: "base" })`, then `normalized` ASC, then `buyCount` DESC as a deterministic tiebreak; `buyCount` does not drive the primary order. |
| `mergeGroceryProducts(targetName, sourceNames, db?)` | `targetName: string, sourceNames: string[], db?: Database` | `{ merged, target }` | Transactionally unifies duplicate products into the existing target. |

Merge semantics (one transaction):

1. **Counts** — sum source `buy_count` onto the target row (insert one if the
   target has no history), then delete the source rows.
2. **Purchase log** — rewrite source `normalized_name` to the target, so
   `getRecentlyBought` sees the max `bought_at`.
3. **Aisles** — per shop, keep the target's mapping (deleting source rows for
   that shop); otherwise keep the most recently used source mapping, re-key it
   to the target, and delete the rest. Avoids PK `(normalized_name, shop_id)`
   collisions.
4. **Aliases** — `saveIngredientAlias(sourceName, targetName)` for each source
   display name, then re-point any existing alias whose `canonical_name`
   normalized matches a source.
5. **Items** — rename matching active `groceries_items.name` only; amount and
   unit are untouched.

Aisle lookup (`getSuggestedAisle` in `src/db/shops.ts`) is alias-aware: it tries
the typed normalized name first, then resolves the canonical name through
`groceries_ingredient_aliases` and tries that. This keeps source spellings
pointing at the target's aisle after a merge. `POST /api/groceries` also retries
the learned aisle when the client sends no aisle and did not make a manual pick;
an explicit manual "Bez alejki" does not retry or delete the learned mapping.

The target MUST be an existing candidate (enforced by
`POST /api/groceries/admin`). The module never touches `groceries_item_aisles`,
which is id-keyed and survives the rename.

## Related Concepts

* [Groceries Schemas](/knowledge/db/schemas/groceries.md)
* [Database Architecture](/knowledge/db/architecture.md)
* [Product Merge (ADR-036)](/docs/adr-036-groceries-product-merge.md)
