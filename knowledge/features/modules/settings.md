---
type: Feature Module
title: Settings Feature Module
description: High-level specification for system-wide configuration, user preferences, and theme selection.
resource: /src/components/settings/SettingsPage.tsx
tags: [feature, settings, configuration, theme]
generated: { by: agent:junie, at: 2026-08-11T06:00:00Z }
status: stable
---

# Settings Feature Module

The Settings feature manages application-wide key-value configuration and user preferences.

## Core Capabilities & Workflows

1. **Configuration Management**: Read and update global system settings.
2. **Dark Theme Preference**: Toggle and persist a per-account UI theme (`dark` / `light`).
   - Saved via `POST /api/settings` and stored by `setTheme` in the `settings` table under the `theme` key.
   - Applied at the app root (`#app-root` in `src/routes/layout.tsx`) via the `dark` class, driving Tailwind `dark:` variant styling across all modules.
   - Theme persists across reloads (SSR via `useSettings`) and across page navigation within the session.
3. **Tab Visibility**: Hide/show navigation tabs per account, persisted under the `hidden_tabs` key.

## Related Concepts

* [Settings UI Components](/knowledge/ui/components/settings.md)
* [Settings Data Access Module](/knowledge/db/modules/settings.md)
* [Settings Schema](/knowledge/db/schemas/settings.md)
* [UI Architecture](/knowledge/ui/architecture.md)
