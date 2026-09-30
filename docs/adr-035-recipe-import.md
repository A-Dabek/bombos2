# ADR-035: Recipe Screenshot Import

## Status

Accepted (2026-09-30).

## Context

Recipe apps export ingredients as a shopping-list **screenshot**, not as text or a
structured file. Re-typing those lists into the planning view is the main source
of friction in the groceries module. We want a path from a screenshot to planned
items with as little manual work as possible, without trusting automated
transcription blindly.

The inputs are hostile to pure OCR: quantities can appear on the next line,
inside the ingredient name, or as arithmetic (`2 duże cebule (po 100 g)` =
`200 g`); category headers (`Wołowina`, `Inne`) are inline and must not become
items; there are genuine duplicates; `½ pęczka` OCRs as `%`; and toolbar noise
(`10:02 … 85%`, `Lista zakupów`) must be dropped. A deterministic parser cannot
recover this reliably, so an LLM is used for extraction — but only for
extraction, never for decisions that are cheap to do deterministically.

## Decision

### A dedicated import view with a mandatory review

`/groceries/import` hosts a three-state wizard: upload → review → confirm.
Planning shows an "Import ze zdjęcia" entry button. **`analyze` performs no DB
writes**; nothing is planned until the user confirms on the review screen. The
screenshot is processed in memory and discarded — it is never persisted.

### OCR is server-side tesseract.js

`src/server/ocr.ts` preprocesses with `sharp` (grayscale → normalize → 2×
upscale, no threshold) and runs `tesseract.js` with the Polish model at
`PSM 6` (`SINGLE_BLOCK`), `cacheMethod: "none"`. Traineddata comes from the
jsDelivr CDN by default (the `4.0.0_best_int` model scored higher than the
system model) or from a local directory via `TESSDATA_PATH`. `tesseract.js`,
`tesseract.js-core`, `wasm-feature-detect`, and `regenerator-runtime` are
**externalized** in the Fastify adapter build because the worker path is derived
from `__dirname`; bundling them breaks worker spawning. A system `tesseract`
binary behind the same `recognizeText` interface is the fallback if the WASM
worker ever fails on Termux.

### The LLM extracts; the backend decides

`src/server/llm.ts` calls OpenRouter in JSON mode (plain `fetch`, no SDK) with a
system prompt that returns **only** `name` (required), `amount`, `unit`,
`description`, and `raw` (the verbatim source fragment). The default model is a
reasoning model: it needs a generous `max_tokens` (16k) and a retry when the
response is empty or truncated by `finish_reason: "length"`.

`src/server/recipe-import.ts` then does everything deterministic:

- canonicalize names through the alias table;
- default a missing/non-positive amount to `1 x`;
- merge duplicates by normalized name, converting `g`↔`kg` and `l`↔`ml` only
  when units differ, and join the source `raw` fragments;
- classify each item as `existing` (exact match on the current list), `possible`
  (fuzzy/alias match against history + list), or `new`;
- attach recency (`Prawdopodobnie masz`) from the purchase log within the configured
  window;
- resolve aisles server-side from the learned product-aisle map, exactly like a
  manually added item. `aisleId: undefined` means "auto", `null` means "none", a
  number is a manual choice.

### New tables, additively

- `groceries_purchase_log (name, normalized_name, bought_at)` with
  `(normalized_name, bought_at DESC)` — a purchase **event** log. A row is
  written in `incrementGroceryItemCount`, the single choke point already used for
  `buy_count`, so recency shares `buy_count`'s timestamp semantics (clearing a
  bought item), not the moment it was ticked.
- `groceries_ingredient_aliases (normalized_alias, canonical_name, updated_at)`
  — a separate layer from `normalizeProductName`, which is persisted in other
  tables and MUST NOT change.

### Alias learning is guarded

`confirm` learns an alias from `sourceName → name` **only when the final name is
an already-known product** (an existing list item, a catalog product, or an
existing alias). Free-form renames are not learned, so a one-off rename cannot
poison future imports.

### A configurable recency window

`settings.inventory_window_days` (default **15**, range **1–15**) controls how
far back the purchase log marks an item as "you probably already have it". It is
exposed through `/api/settings` and the settings UI.

### Test seam

`GROCERIES_IMPORT_STUB=true` short-circuits `analyze` with canned draft items so
the wizard, review, and confirm flows can be exercised in E2E without OCR, LLM,
network, or cost. Query/analysis logic is unit-tested with an injected
extractor/fetcher.

## Alternatives considered

- **Client-side OCR (tesseract.js in the browser).** Avoids server bundling
  issues but ships a large WASM model to the phone, is slower, and still needs
  the LLM call (which would then need the API key on the client). Rejected.
- **System `tesseract` binary via `child_process`.** Node-only and unavailable on
  some Termux setups; kept only as a fallback behind the OCR interface.
- **Let the LLM merge duplicates and convert units.** Rejected: arithmetic in an
  LLM is unreliable and untestable. Merging and unit mapping are deterministic
  concerns and live in `recipe-import.ts`.
- **Persist the screenshot.** Rejected: no product value, adds storage/PII
  surface. It is processed and discarded.
- **Auto-apply high-confidence items without review.** Rejected: OCR + fuzzy
  matching can be wrong; a mandatory review keeps every mistake user-correctable
  before any write.

## Consequences

- Migrations `034`/`035` add the purchase log and alias tables (additive; no
  existing column semantics change).
- The settings table gains `inventory_window_days`; `/api/settings` and the
  settings page expose a control.
- Planning gains an import entry button; a new `/groceries/import` route and
  `src/components/groceries/import/` components.
- Each real import costs roughly **$0.005** and takes ~15–20 s; the UI shows a
  spinner and the LLM call retries once on empty/truncated output.
- Recency reflects *clearing* a bought item, not *ticking* it (consistent with
  `buy_count`). Moving to true shopping-time would need a `bought_at` column on
  `groceries_items`.
- A fresh install has an empty purchase log, so recency hints only appear after
  purchases are cleared.
