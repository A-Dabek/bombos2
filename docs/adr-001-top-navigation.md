# ADR-001: Top Tab Navigation

## Status
Accepted

## Context
The bombos2 mobile web app started with a single home route and no navigation structure. As we add distinct functional modules (Parcels, Meals, Money, Shopping), users need a clear, always-available way to switch between them.

## Decision
We will implement a top tab navigation bar rendered in a root Qwik City layout (`src/routes/layout.tsx`).

- **Position**: Top of the page, **not** fixed. It scrolls away with content to maximize screen real estate on mobile.
- **Style**: Tabs with an active-state highlight (underline + color change).
- **Width distribution**: Equal-width flex items so all four tabs always fit the viewport without horizontal scrolling.
- **Route structure**: Each tab maps to its own route (`/parcels`, `/meals`, `/money`, `/shopping`).
- **Home redirect**: `/` redirects server-side to `/parcels` so the user always lands in a module.

## Consequences
- Every page in the app will automatically include the nav via the root layout.
- Module pages remain lightweight placeholders for now.
- No sticky/fixed positioning keeps the implementation simple and respects mobile screen space.