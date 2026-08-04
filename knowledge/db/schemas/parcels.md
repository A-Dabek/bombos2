---
type: SQLite Schema
title: Parcels Database Schema
description: Table schema for parcels with binary image storage.
resource: /src/db/migrations/002_parcels.sql
tags: [database, schema, parcels, sqlite, blob]
sources:
  - id: migration-002
    resource: /src/db/migrations/002_parcels.sql
    title: Initial parcels table
  - id: migration-003
    resource: /src/db/migrations/003_parcels_completed_at.sql
    title: Add completed_at column to parcels
  - id: migration-004
    resource: /src/db/migrations/004_parcels_note.sql
    title: Add note column to parcels
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Parcels Schema

The parcels table manages incoming and outgoing delivery items, including uploaded image binary data (`BLOB`), completion status, and notes.

## Table

### `parcels`

```sql
CREATE TABLE parcels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('incoming', 'outgoing')),
  image BLOB NOT NULL,
  content_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  completed_at INTEGER,
  note TEXT DEFAULT NULL
);
```

#### Columns

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique parcel record ID. |
| `type` | `TEXT` | `NOT NULL CHECK(type IN ('incoming', 'outgoing'))` | Parcel direction category constraint. |
| `image` | `BLOB` | `NOT NULL` | Raw uploaded image file binary buffer. |
| `content_type` | `TEXT` | `NOT NULL` | Image MIME content-type (e.g. `image/png`, `image/jpeg`). |
| `created_at` | `INTEGER` | `NOT NULL` | Unix timestamp of parcel creation/upload (ms). |
| `completed_at` | `INTEGER` | `NULL` | Timestamp when parcel was marked complete/collected. |
| `note` | `TEXT` | `DEFAULT NULL` | Per-parcel custom user note (ADR-007). |

## Related Concepts

* [Parcels DB Module](/knowledge/db/modules/parcels.md)
