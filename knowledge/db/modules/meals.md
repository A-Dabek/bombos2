---
type: Data Access Module
title: Meals DB Module
description: Data access functions for managing meal suggestions categorized by dinner and supper.
resource: /src/db/meals.ts
tags: [database, data-access, meals, typescript]
sources:
  - id: meals-module
    resource: /src/db/meals.ts
    title: Meals data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Meals DB Module

Module `/src/db/meals.ts` provides functions to fetch, add, and delete meal suggestions by category (`dinner`, `supper`).

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getMealsByCategory(category, db?)` | `category: 'dinner' \| 'supper', db?: Database` | `Meal[]` | Fetches all meal entries for specified category constraint. |
| `createMeal(category, name, db?)` | `category: 'dinner' \| 'supper', name: string, db?: Database` | `Meal` | Adds new meal entry under given category. |
| `deleteMeal(id, db?)` | `id: number, db?: Database` | `boolean` | Deletes meal suggestion by ID. |

## Related Concepts

* [Meals Schema](/knowledge/db/schemas/meals.md)
* [Database Architecture](/knowledge/db/architecture.md)
