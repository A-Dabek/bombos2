---
type: UI Component
title: Parcels UI Components
description: UI components for parcel management including list view, lightbox, upload button, and navigation.
resource: /src/components/parcels/
tags: [ui, parcels, components]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# Parcels UI Components

Parcels UI components provide image uploading, grid/list viewing, lightbox inspection, and completion/notes management.

## Components

| Component / File | Inputs / Props | Returns / Type | Description |
|---|---|---|---|
| `ParcelsPage.tsx` | Page state | JSX.Element | Main incoming/outgoing parcel page container. |
| `ParcelList.tsx` | `parcels: Parcel[]` | JSX.Element | Grid view container rendering parcel items. |
| `ParcelListItem.tsx` | `parcel: Parcel` | JSX.Element | Individual parcel card with image thumbnail, notes, and actions. |
| `ParcelLightbox.tsx` | `parcel: Parcel`, `onClose` | JSX.Element | Fullscreen image lightbox modal. |
| `UploadButton.tsx` | `onUpload` | JSX.Element | Camera/file image upload button trigger. |
| `ParcelSubNav.tsx` | Active tab | JSX.Element | Sub-navigation between incoming and outgoing parcels. |

## Domain Logic & User Interaction

- Supports uploading images via file picker or camera.
- Grid layout with responsive image thumbnails.
- Clickable thumbnails open `ParcelLightbox` for high-resolution inspection.
- Mark parcels as complete or add per-parcel notes.

## Related Concepts

* [Parcels Feature Module](/knowledge/features/modules/parcels.md)
* [Parcels Data Access Module](/knowledge/db/modules/parcels.md)
