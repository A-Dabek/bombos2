---
type: UI Component
title: Meals UI Components
description: UI components for meal planning, meal administration, randomizer, and sub-navigation.
resource: /src/components/meals/
tags: [ui, meals, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Meals UI Components

Meals UI components provide meal administration, randomizer tools, and meal planning views.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `MealPage.tsx` | Page state | JSX.Element | Main meal planning and selection page. |
| `MealAdmin.tsx` | Meal list | JSX.Element | Meal management administration view. |
| `MealAdminItem.tsx` | Meal item | JSX.Element | Individual meal item row with edit/delete actions. |
| `MealRandomizer.tsx` | Meals list | JSX.Element | Random meal picker widget. |
| `MealSubNav.tsx` | Active tab | JSX.Element | Navigation between meal views and administration. |

## Domain Logic & User Interaction

- Manage meal options (dinner/supper).
- Random meal selection widget to pick daily meals.

## Related Concepts

* [Meals Feature Module](/knowledge/features/modules/meals.md)
* [Meals Data Access Module](/knowledge/db/modules/meals.md)
