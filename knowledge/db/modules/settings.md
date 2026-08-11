---
type: Data Access Module
title: Settings DB Module
description: Data access functions for global and per-account application key-value settings.
resource: /src/db/settings.ts
tags: [database, data-access, settings, typescript]
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

## Related Concepts

* [Settings Schema](/knowledge/db/schemas/settings.md)
* [Database Architecture](/knowledge/db/architecture.md)
