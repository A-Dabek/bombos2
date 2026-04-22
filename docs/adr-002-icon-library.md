# ADR-002: Icon Library

## Status
Accepted

## Context
The navigation tabs need icons alongside text labels for better mobile UX. We needed a library compatible with Qwik's `component$` architecture and Deno's npm specifier workflow.

## Decision
We will use `@qwikest/icons`.

- It is built specifically for Qwik, exporting icons as proper Qwik components.
- It wraps the Heroicons set (well-designed, MIT-licensed).
- It works with Deno's npm imports without requiring React compatibility shims.
- Tree-shakeable: only imported icons are bundled.

## Alternatives Considered
- **Inline SVGs copied from Heroicons**: Zero dependency, but requires manual maintenance and bloats component files.
- **React icon libraries (e.g., `lucide-react`)**: Incompatible with Qwik's component model without heavy wrappers.

## Consequences
- One additional dependency in `deno.json`.
- Icons are imported and used exactly like any other Qwik component.