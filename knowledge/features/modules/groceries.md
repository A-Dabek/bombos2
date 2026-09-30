---
type: Feature Module
title: Groceries Feature Module
description: High-level specification for grocery planning, shopping lists, per-shop aisle filtering, frequent-purchase stats, and recipe-screenshot import.
resource: /src/components/groceries/ShoppingList.tsx
tags: [feature, groceries, shopping, planning, import]
generated: { by: agent:opencode, at: 2026-09-30T00:00:00Z }
status: stable
---

# Groceries Feature Module

The Groceries feature manages grocery list planning, shopping list execution,
per-shop aisle organization, frequent-purchase counting, and importing an
ingredient list from a screenshot.

## Core Capabilities & Workflows

1. **Planning Mode**: Add and organize planned items with quantities and per-shop
   aisles.
2. **Shopping Mode**: Interactive shopping checklist grouped by aisle with quick
   completion toggles.
3. **Auto-Suggestions**: Product suggestions based on historical purchase counts.
4. **Recipe Screenshot Import**: Upload a screenshot of a recipe/shopping list;
   OCR + an LLM extract ingredients into a **mandatory review** screen where the
   user edits/merges/deletes, then confirms. No items are written before confirm.
   - OCR: server-side `tesseract.js` (`pol`, PSM 6) with `sharp` preprocessing.
   - Extraction: OpenRouter JSON mode; the LLM returns only
     `name`/`amount`/`unit`/`description`/`raw`.
   - Backend does the deterministic work: alias canonicalization, duplicate
     merge, unit defaults, match classification (`existing`/`possible`/`new`),
     recency (`Prawdopodobnie masz`, window setting), and aisle resolution.
   - `GROCERIES_IMPORT_STUB=true` returns canned draft items for E2E.

See [ADR-035: Recipe Screenshot Import](/docs/adr-035-recipe-import.md).

## Related Concepts

* [Groceries UI Components](/knowledge/ui/components/groceries.md)
* [Groceries Data Access Module](/knowledge/db/modules/groceries.md)
* [Groceries Schema](/knowledge/db/schemas/groceries.md)
* [Recipe Import (ADR-035)](/docs/adr-035-recipe-import.md)
