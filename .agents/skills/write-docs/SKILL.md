---
name: write-docs
description: Guide for creating structured, reference-centric technical documentation and knowledge bases using the Open Knowledge Format (OKF) specification and repository simplifications profile.
tags: [documentation, okf, references, knowledge-base, writing, spec, simplifications]
---

# Writing Documentation via References (OKF Pattern)

This skill describes how to write high-quality, maintainable technical documentation using a reference-centric approach based on the **Open Knowledge Format (OKF) v0.2 Specification** (`/knowledge/SPEC.md`) and the repository-specific **OKF Simplifications Profile** (`/knowledge/SIMPLIFICATIONS.md`).

Instead of duplicating source code or implementation details in Markdown, reference-centric documentation serves as a structured map, contract summary, and index over actual codebase resources.

---

## Specifications & Rules Reference

When writing or updating documentation in this repository, always align with the following core specification documents:

1. **OKF v0.2 Specification ([`/knowledge/SPEC.md`](/knowledge/SPEC.md))**:
   - The foundational Open Knowledge Format v0.2 specification.
   - Defines standard OKF concepts, metadata conventions, provenance rules, attestation models, and bundle structures.
   - Serves as the authoritative baseline specification.

2. **Repository Simplifications Profile ([`/knowledge/SIMPLIFICATIONS.md`](/knowledge/SIMPLIFICATIONS.md))**:
   - The active profile tailored for this repository (single-developer, streamlined knowledge base).
   - Documents exact simplifications vs. full OKF v0.2 spec (e.g. required frontmatter fields, simplified trust/author context, local migration sources).
   - Defines the standardized frontmatter template and concept taxonomy (`SQLite Schema`, `Data Access Module`, `Database Architecture`, `Attested Computation`, `UI Architecture`, `UI Component`, `Feature Module`, `Specification Profile`).

---

## Core Principles

1. **Reference Over Replication**: Never copy full source code blocks into documentation. Summarize signatures, parameters, or schemas, and point directly to source code files via `resource` URIs.
2. **Metadata First (YAML Frontmatter)**: Every concept document starts with structured YAML metadata defining its type, title, target resource, tags, and status.
3. **High Signal-to-Noise Ratio**: Use structured tables, bullet points, and concise descriptions. Omit prose filler.
4. **Interconnected Knowledge Graph**: Cross-link related concepts using explicit Markdown links (`[Related Concept](/knowledge/...)`).
5. **Traceable Navigation & Audit Trail**: Maintain directory index files (`index.md`) for discovery and log files (`log.md`) for chronological updates.

---

## Document Structure & Schema

Every concept file MUST be a Markdown document containing a YAML frontmatter header followed by a structured Markdown body.

```markdown
---
type: <SQLite Schema | Data Access Module | Database Architecture | Attested Computation | UI Architecture | UI Component | Feature Module | Specification Profile>
title: <Clear Display Title>
description: <One-line summary of the concept>
resource: </relative/path/to/source/file>
tags: [<tag1>, <tag2>]
sources:
  - id: <source-id>
    resource: </path/to/source>
    title: <Short description>
generated: { by: agent:<agent-name>, at: <ISO-8601-timestamp> }
status: <draft | stable | deprecated>
---

# <Title>

<Brief paragraph explaining the purpose of this concept and its role in the system.>

## <Key Section: Functions / Tables / Endpoints>

| Name / Identifier | Inputs / Parameters | Returns / Type | Description |
|---|---|---|---|
| `functionName(param)` | `param: Type` | `ReturnType` | Short description of purpose and side-effects. |

## <Domain Logic / Business Rules>

<Concise breakdown of non-obvious business logic, transactions, or state transitions.>

## Related Concepts

* [<Related Title>](/path/to/concept.md)
* [<Architecture Guide>](/path/to/architecture.md)
```

---

## Standard Metadata Fields

| Field | Required | Description | Example |
|---|---|---|---|
| `type` | Yes | Category of the concept document. | `Data Access Module`, `SQLite Schema` |
| `title` | Yes | Human-readable title of the document. | `Allowance DB Module` |
| `description` | Yes | Concise 1-sentence summary. | `Data access functions for allowance configuration.` |
| `resource` | Yes | Primary repository file path this doc refers to. | `/src/db/allowance.ts` |
| `tags` | No | List of searchable keywords. | `[database, allowance, typescript]` |
| `sources` | No | Originating files (e.g. SQL migrations, specs). | `[{ id: 'migration-010', resource: '/src/db/migrations/010_allowance.sql' }]` |
| `generated` | No | Attribution and ISO timestamp. | `{ by: "agent:junie", at: "2026-08-04T17:30:00Z" }` |
| `status` | No | Document stability status. | `stable`, `draft` |

---

## Step-by-Step Writing Workflow

1. **Identify the Target Resource**:
   - Locate the source code file or artifact (e.g., `/src/db/allowance.ts`, `/src/db/migrations/010_allowance.sql`).
2. **Determine Concept Scope & Type**:
   - Consult [`/knowledge/SIMPLIFICATIONS.md`](/knowledge/SIMPLIFICATIONS.md) for the active concept taxonomy (e.g., `SQLite Schema`, `Data Access Module`, `Database Architecture`, `Attested Computation`, `UI Architecture`, `UI Component`, `Feature Module`, `Specification Profile`).
   - Refer to [`/knowledge/SPEC.md`](/knowledge/SPEC.md) if advanced OKF concepts or full specification details are required.
3. **Extract Minimal API / Schema Contracts**:
   - For database schemas: List tables, column names, data types, defaults, and constraints in a table.
   - For code modules: List exported functions, parameters, return types, and brief descriptions in a table.
4. **Document Core Behavior & Edge Cases**:
   - Explain critical business rules (e.g., monthly period rollover, singleton configuration defaults) without pasting full functions.
5. **Add Cross-References**:
   - Link to corresponding schema docs, architecture guides, or dependent modules.
6. **Register in Index & Log**:
   - Add the document link to the parent `index.md`.
   - Record document creation or significant updates in `log.md`.

---

## Best Practices & Anti-Patterns

### DO
- **DO** use absolute bundle paths (`/knowledge/db/schemas/allowance.md`) or relative paths (`./schemas/allowance.md`) for links.
- **DO** keep descriptions factual, precise, and up-to-date with code.
- **DO** update `index.md` whenever adding a new concept file.

### DON'T
- **DON'T** copy-paste full source code blocks. Summarize signatures and point to `resource`.
- **DON'T** create monolithic mega-docs. Break documentation down into single-concept files.
- **DON'T** omit the YAML frontmatter or `resource` URI.
