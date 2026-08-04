---
type: Feature Module
title: Features Architecture & Overview
description: Overview of high-level functional modules, data flow, and core workflows of bombos2.
resource: /src/routes/
tags: [features, architecture, overview]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Features Architecture & Overview

`bombos2` is structured around distinct domain feature modules combining SQLite storage, data access modules, Qwik City API route handlers, and reactive UI components.

## Core Domain Features

1. **Parcels**: Incoming and outgoing parcel tracking with photo upload, lightbox preview, completion status, per-parcel notes, and daily auto-cleanup.
2. **Groceries**: Shopping lists, planning views, category filtering, and buy-count frequency analytics.
3. **Meals**: Dinner/supper meal planning, administration, and randomizer tool.
4. **Money & Flows**: Recurring income and expense flow management.
5. **Allowance**: Allowance configuration and period transaction tracking.
6. **Bills**: Monthly bill tracking, automatic payments, and predefined templates.
7. **Plan**: Task and item organization with accordion views.
8. **Balance**: Account balance tracking and period management.
9. **Settings**: Global key-value system settings.

## Related Concepts

* [UI Architecture & Qwik Patterns](/knowledge/ui/architecture.md)
* [Database Architecture](/knowledge/db/architecture.md)
