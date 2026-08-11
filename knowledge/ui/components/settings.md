---
type: UI Component
title: Settings UI Components
description: UI components for system settings configuration, tab visibility, and theme preferences.
resource: /src/components/settings/
tags: [ui, settings, components, theme]
generated: { by: agent:junie, at: 2026-08-11T06:00:00Z }
status: stable
---

# Settings UI Components

Settings UI components provide interfaces for managing system configuration and preferences.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `SettingsPage.tsx` | Settings state (`hiddenTabs`, `theme`) | JSX.Element | Main system settings view: theme toggle, tab visibility toggles, and account logout. |

## Domain Logic & User Interaction

- **Theme toggle** (`data-testid="toggle-dark-theme"`): POSTs `{ theme }` to `/api/settings`, then toggles the `dark` class (plus `bg-gray-900`/`text-gray-100` vs `bg-white`/`text-gray-900`) on `#app-root` and `document.documentElement` immediately for an instant client-side visual switch.
- **Tab visibility toggles** (`data-testid="toggle-tab-..."`): POSTs `{ hiddenTabs }` to `/api/settings`; a "Odwiedź" link (`data-testid="visit-tab-..."`) points to hidden tabs so they remain reachable.
- Theme and hidden-tab preferences persist via the settings API and are re-applied on page load through SSR in `src/routes/layout.tsx` (`useSettings` route loader).

## Related Concepts

* [Settings Feature Module](/knowledge/features/modules/settings.md)
* [Settings Data Access Module](/knowledge/db/modules/settings.md)
