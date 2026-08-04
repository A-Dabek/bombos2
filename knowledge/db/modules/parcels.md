---
type: Data Access Module
title: Parcels DB Module
description: Data access functions for parcel image uploads, status updates, notes, and auto-cleanup.
resource: /src/db/parcels.ts
tags: [database, data-access, parcels, typescript]
sources:
  - id: parcels-module
    resource: /src/db/parcels.ts
    title: Parcels data access module
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# Parcels DB Module

Module `/src/db/parcels.ts` handles delivery parcel management, including image binary storage, mark-as-complete, user notes, and automated cleanup.

## Key Functions

| Function | Parameters | Return Type | Description |
|---|---|---|---|
| `getParcels(type, db?)` | `type: 'incoming' \| 'outgoing', db?: Database` | `Parcel[]` | Fetches active or completed parcels for direction type ordered by creation timestamp desc. |
| `createParcel(type, image, contentType, db?)` | `type: 'incoming' \| 'outgoing', image: Buffer, contentType: string, db?: Database` | `Parcel` | Saves new parcel record with raw image BLOB buffer. |
| `completeParcel(id, db?)` | `id: number, db?: Database` | `boolean` | Sets `completed_at` timestamp on parcel. |
| `updateParcelNote(id, note, db?)` | `id: number, note: string \| null, db?: Database` | `boolean` | Updates custom parcel note (ADR-007). |
| `getIncompleteParcelsCount(db?)` | `db?: Database` | `{ incoming: number, outgoing: number }` | Counts pending incomplete parcels per direction. |
| `deleteCompletedParcels(db?)` | `db?: Database` | `number` | Deletes all completed parcels older than daily cleanup window. |

## Daily Auto-Cleanup Logic

Completed parcels are retained temporarily so users can review recent deliveries. `deleteCompletedParcels` is invoked by scheduled backend tasks to delete completed parcels, keeping image BLOB storage overhead low.

## Related Concepts

* [Parcels Schema](/knowledge/db/schemas/parcels.md)
* [Database Architecture](/knowledge/db/architecture.md)
