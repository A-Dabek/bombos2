---
type: Specification Profile
title: OKF v0.2 Simplifications for bombos2
description: Profile and simplifications of the Open Knowledge Format (OKF) v0.2 used in bombos2.
resource: /knowledge/SPEC.md
tags: [okf, specification, knowledge-base, profile]
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---

# OKF v0.2 Simplifications for bombos2

This repository adopts the **Open Knowledge Format (OKF) v0.2** specification (`/knowledge/SPEC.md`) for structuring AI agent knowledge. Because `bombos2` is a personal, single-developer project, a lightweight profile of OKF v0.2 is applied to minimize boilerplate while preserving full agent compatibility, diffability, and cross-linking.

---

## 1. Adopted Rules & Core Conventions

1. **Bundle Root**: The knowledge bundle lives in `/knowledge/`.
2. **Standard Document Structure**: Every concept file is a Markdown file (`.md`) with YAML frontmatter delimited by `---` and a Markdown body.
3. **Reserved Filenames**: `index.md` (directory listing / navigation) and `log.md` (chronological update history) are reserved and do not represent standalone concepts.
4. **Links**: Absolute bundle-relative links starting with `/` (e.g., `/knowledge/db/architecture.md`) or relative Markdown links (`./other.md`) are used for cross-referencing.
5. **Resource URIs**: `resource` frontmatter fields point to local repository relative paths (e.g., `/src/db/connection.ts`).

---

## 2. Simplifications vs. Full Specification

| SPEC Feature | Full Spec (v0.2) | bombos2 Simplified Profile |
|---|---|---|
| **Frontmatter Required** | `type` | `type`, `title`, `description`, `resource`, `generated`, `status` |
| **Trust & Verification** | Multi-human `verified` list, credibility signals, `usage_count`, `usage_window` | Omitted or simplified. Single author trust context assumed (`human:asan` or `agent:junie`). |
| **Attested Computations** | Full `executor` and `attester` script runners | Simplified inline SQL / function contracts under `# Computation` without external attester runners unless needed. |
| **Source Provenance** | Detailed external URI sources with usage windows | `sources` field points to local migration files (`/src/db/migrations/NNN_*.sql`) or source files. |
| **Concept Types** | Unregistered, open string values | Standardized domain types: `Specification Profile`, `Database Architecture`, `SQLite Schema`, `Data Access Module`, `Attested Computation`, `UI Architecture`, `UI Component`, `Feature Module`. |

---

## 3. Standard Concept Frontmatter Template

```yaml
---
type: <SQLite Schema | Data Access Module | Database Architecture | Attested Computation | UI Architecture | UI Component | Feature Module>
title: <Display Title>
description: <One-line summary>
resource: </path/to/source/file>
tags: [<tag1>, <tag2>]
generated: { by: agent:junie, at: 2026-08-04T17:30:00Z }
status: stable
---
```

---

## 4. Concept Taxonomy for bombos2

- **`Specification Profile`**: Meta-knowledge defining rules and specs (e.g., this document).
- **`Database Architecture`**: System architecture, DB lifecycle, connection management, and migration execution.
- **`SQLite Schema`**: Table definitions, columns, data types, constraints, and relationships.
- **`Data Access Module`**: TypeScript modules in `src/db/` exposing functions for CRUD operations.
- **`Attested Computation`**: Business logic calculations, period rollover calculations, and SQL aggregates.
- **`UI Architecture`**: Qwik City routing, client-side fetching patterns (`useVisibleTask$`), and UI component design patterns.
- **`UI Component`**: Qwik UI components and user interaction views in `src/components/` and route pages.
- **`Feature Module`**: High-level domain features (`Parcels`, `Groceries`, `Meals`, `Money & Flows`, `Allowance`, `Bills`, `Plan`, `Balance`, `Settings`).
