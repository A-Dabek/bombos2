---
type: UI Architecture
title: UI Architecture & Qwik Patterns
description: Qwik City routing, client-side data fetching via useVisibleTask$, and reactive component design rules.
resource: /src/components/
tags: [ui, qwik, architecture, patterns]
generated: { by: agent:junie, at: 2026-08-04T18:00:00Z }
status: stable
---

# UI Architecture & Qwik Patterns

The `bombos2` mobile web app is built using Qwik City routing and Tailwind CSS styling. Client-side data fetching and interactions follow Qwik's resumability model and component guidelines.

## Core UI Principles & Patterns

1. **Qwik City Routes**: Route components reside in `src/routes/` and handle server-side loaders/actions (`onGet`, `onPost`) as well as page layout.
2. **Client-Side Data Fetching**: Pages fetch initial data or interact with APIs via `useVisibleTask$` or Qwik resource hooks.
3. **Stable JSX Trees in Children**: **Critical Qwik gotcha**: Never put reactive conditional early returns in child components that emit events to parents. Always render a stable JSX tree in children; let the parent handle conditional rendering.
4. **Tailwind CSS Utility Styling**: Layouts and styling use Tailwind utility classes for mobile-first responsive design.

## Related Concepts

* [Parcels UI Components](components/parcels.md)
* [Shared UI Components](components/shared.md)
* [High-Level Features Overview](/knowledge/features/overview.md)
