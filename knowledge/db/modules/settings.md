---
type: Data Access Module
title: Settings DB Module
description: Data access functions for global application key-value settings.
resource: /src/db/settings.ts
tags: [database, data-access, settings, typescript]
sources:
  - id: settings-module
    resource: /src/db/settings.ts
    title: Settings data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Settings DB Module

Module `/src/db/settings.ts` provides functions for reading and writing application-wide key-value settings stored in the `settings` table.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getHiddenTabs(db?)` | `db?: Database` | `string[]` | Reads list of navigation tab identifiers hidden by the user. |
| `setHiddenTabs(tabs, db?)` | `tabs: string[], db?: Database` | `void` | Updates list of hidden navigation tabs stored as JSON under key `'hidden_tabs'`. |

## Related Concepts

* [Settings Schema](/knowledge/db/schemas/settings.md)
* [Database Architecture](/knowledge/db/architecture.md)
