---
type: Feature Module
title: Parcels Feature Module
description: High-level specification for parcel tracking, image uploads, lightbox viewing, notes, and auto-cleanup.
resource: /src/components/parcels/ParcelsPage.tsx
tags: [feature, parcels, upload, lightbox]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Parcels Feature Module

The Parcels feature manages incoming and outgoing package tracking with photo uploads, lightbox zoom, completion marking, per-parcel notes (ADR-007), and daily automatic cleanup of old completed parcels.

## Core Capabilities & Workflows

1. **Image Upload**: Upload parcel photos via file picker or camera, storing image data as BLOBs in SQLite.
2. **Grid & Lightbox View**: Display parcels in a responsive grid view with thumbnail previews; click to open fullscreen `ParcelLightbox`.
3. **Completion & Notes**: Mark parcels as completed and add freeform notes per parcel.
4. **Auto-Cleanup**: Scheduled daily cleanup removes old completed parcels.

## Related Concepts

* [Parcels UI Components](/knowledge/ui/components/parcels.md)
* [Parcels Data Access Module](/knowledge/db/modules/parcels.md)
* [Parcels Schema](/knowledge/db/schemas/parcels.md)
