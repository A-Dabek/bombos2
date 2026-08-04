---
name: read-docs
description: Guide for efficiently reading, navigating, and consuming reference-centric technical documentation and knowledge bases without context window bloat.
tags: [documentation, okf, navigation, reading, knowledge-base]
---

# Reading Documentation & Knowledge Bases (Reference Pattern)

This skill explains how to navigate, read, and consume reference-centric technical documentation (such as Open Knowledge Format / OKF knowledge bases) efficiently.

Reference-centric documentation acts as an indexed map of the codebase. Following a structured reading workflow allows agents and developers to quickly build mental models, locate exact code files, and avoid flooding the context window with unnecessary file dumps.

---

## Core Reading Principles

1. **Top-Down Navigation**: Always navigate from index files (`index.md`) to specific concept documents. Never read documentation files randomly.
2. **Metadata-First Inspection**: Read the YAML frontmatter (`type`, `description`, `resource`) first to quickly determine if a document is relevant before reading the full body.
3. **Bridge to Source Code**: Treat documentation as a guide to locate source files (`resource: /src/...`). When implementation details or code modifications are required, use the `resource` path to open the precise source file.
4. **Follow Cross-Links Contextually**: Use `Related Concepts` sections to navigate to dependencies or related schemas only as needed.
5. **Context Window Efficiency**: Read only the target concept documents required for the task. Do not load entire documentation directories at once.

---

## The 4-Step Reading Workflow

```
┌────────────────────────┐
│  1. Start at Root      │  Check knowledge/index.md to locate relevant module
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  2. Consult Domain     │  Check knowledge/<domain>/index.md for concept listing
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  3. Read Target Doc    │  Inspect YAML frontmatter & summary tables
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  4. Bridge to Resource │  Open actual source file from `resource:` field if needed
└────────────────────────┘
```

### Step 1: Root Index Discovery
- Open the root index file (e.g., `/knowledge/index.md` or `/docs/index.md`).
- Scan the high-level section listings (e.g., Database Layer, API Routes, Frontend Architecture) to find the relevant domain.

### Step 2: Domain Index Lookup
- Open the domain index (e.g., `/knowledge/db/index.md`).
- Locate the specific concept document corresponding to the system component, table, or module in question.

### Step 3: Concept Document Inspection
- **Frontmatter Parsing**: Check `type`, `title`, `description`, and `resource`. Verify that this concept matches your target area.
- **Summary & Tables**: Review the function/table summary tables for signature contracts, parameter types, or database column definitions.
- **Business Logic & Rules**: Read non-obvious logic descriptions (e.g., period rollover, auto-cleanup jobs, caching behavior).

### Step 4: Code Navigation & Verification
- If you need to make code edits or debug runtime behavior:
  - Copy the file path from the `resource` field (e.g., `/src/db/allowance.ts`).
  - Open the source file directly.
- If you need to inspect underlying migrations or schemas:
  - Refer to the `sources` list in the frontmatter to find relevant migration files.

---

## Navigation Cheat Sheet

| Task | Starting Point | Action |
|---|---|---|
| **OKF Specification baseline** | [`knowledge/SPEC.md`](/knowledge/SPEC.md) | Read official OKF v0.2 specification rules and terminology. |
| **Project OKF Simplifications** | [`knowledge/SIMPLIFICATIONS.md`](/knowledge/SIMPLIFICATIONS.md) | Read active repository profile, simplifications, and concept taxonomy. |
| **Overview of module structure** | `knowledge/index.md` | Read system breakdown and navigate to domain folder. |
| **Finding table schema / columns** | `knowledge/db/index.md` | Navigate to `schemas/<entity>.md` to inspect column types & constraints. |
| **Finding exported DB functions** | `knowledge/db/index.md` | Navigate to `modules/<entity>.md` to inspect function signatures & descriptions. |
| **Finding UI component specs** | `knowledge/ui/index.md` | Navigate to `components/<entity>.md` to inspect component props and usage. |
| **Finding feature modules** | `knowledge/features/index.md` | Navigate to `modules/<entity>.md` to inspect high-level features. |
| **Understanding system behavior** | `knowledge/db/architecture.md` | Read architecture or migration concepts for system lifecycle rules. |
| **Auditing recent doc updates** | `knowledge/log.md` | Check update history for chronological changes. |

---

## Best Practices & Anti-Patterns

### DO
- **DO** check frontmatter `resource` URIs to know where implementation code lives.
- **DO** navigate using `index.md` files rather than searching blindly through subdirectories.
- **DO** use `Related Concepts` to discover connected schemas or modules.

### DON'T
- **DON'T** load all documentation files into context simultaneously.
- **DON'T** assume documentation contains full code implementation; use `resource` to check actual source files when needed.
- **DON'T** ignore `type` or `description` metadata in frontmatter.
