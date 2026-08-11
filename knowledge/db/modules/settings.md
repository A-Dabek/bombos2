---
type: Data Access Module
title: Settings DB Module
description: Data access functions for global and per-account application key-value settings.
resource: /src/db/settings.ts
tags: [database, data-access, settings, theme, typescript]
sources:
  - id: settings-module
    resource: /src/db/settings.ts
    title: Settings data access module
generated: { by: agent:junie, at: 2026-08-11T06:00:00Z }
status: stable
---

# Settings DB Module

Module `/src/db/settings.ts` provides functions for reading and writing key-value settings stored in the `settings` table, supporting both default and per-account configurations via the `user_email` dimension.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getHiddenTabs(email?, db?)` | `email?: string, db?: Database` | `string[]` | Reads list of navigation tab identifiers hidden for the specified user account, falling back to default settings if no account setting is present. |
| `setHiddenTabs(emailOrTabs, tabsOrDb?, maybeDb?)` | `emailOrTabs: string \| string[], tabsOrDb?: string[] \| Database, maybeDb?: Database` | `void` | Updates list of hidden navigation tabs stored as JSON under key `'hidden_tabs'` for a specific user email or default account. |
| `getTheme(email?, db?)` | `email?: string, db?: Database` | `"dark" \| "light"` | Reads the UI theme preference for the specified user account, falling back to the `default` account theme, then to `"light"`. Stored as JSON under key `'theme'`. |
| `setTheme(emailOrTheme, themeOrDb?, maybeDb?)` | `emailOrTheme: string \| "dark" \| "light", themeOrDb?: "dark" \| "light" \| Database, maybeDb?: Database` | `void` | Persists the UI theme preference (either `"dark"` or `"light"`) for a specific user email or the default account. |

## Domain Logic & Business Rules

- Both `hidden_tabs` and `theme` values are stored as JSON strings in the `settings.value` column, keyed by `(key, user_email)`.
- `getTheme` resolution order: account-specific row → `default` account row → `"light"`. Unknown or malformed values fall back to `"light"`.
- `setTheme` accepts a bare `"dark"`/`"light"` string (writes to the default account) or an email plus theme value (writes to that account).

## Related Concepts

* [Settings Schema](/knowledge/db/schemas/settings.md)
* [Database Architecture](/knowledge/db/architecture.md)
