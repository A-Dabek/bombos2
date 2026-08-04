---
type: UI Component
title: Shared UI Components
description: Reusable UI primitives such as buttons, checkboxes, inputs, and period start triggers.
resource: /src/components/shared/
tags: [ui, shared, components, primitives]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Shared UI Components

Shared UI primitives and common components used across multiple feature modules in `bombos2`.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `AdminButton.tsx` | Click handler, label | JSX.Element | Button to toggle or access admin views. |
| `BackButton.tsx` | Route/click action | JSX.Element | Navigation back button. |
| `Checkbox.tsx` | Checked state, change handler | JSX.Element | Styled checkbox primitive. |
| `DayOfMonthConfigSection.tsx` | Config props | JSX.Element | Section for configuring day-of-month recurrence. |
| `DayOfMonthInput.tsx` | Value, onChange | JSX.Element | Input field for day-of-month values. |
| `PeriodStartButton.tsx` | Trigger action | JSX.Element | Button to trigger period rollover. |

## Domain Logic & User Interaction

- Provide consistent styling and reusable input/navigation widgets across the app.

## Related Concepts

* [UI Architecture](architecture.md)
