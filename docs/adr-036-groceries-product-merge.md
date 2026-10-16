# ADR-036: Groceries Product Merge

## Status

Accepted (2026-10-05).

## Context

Recipe imports, OCR, manual entry, and synonyms produce the same real-world
product under several display names (`Pierś z kurczaka`, `Filet z piersi
kurczaka`, `Kurczak pierś`). The groceries tables are keyed by
`normalizeProductName(name)` (lowercase + strip whitespace), so these variants
are distinct rows:

- `groceries_product_counts(name, normalized_name UNIQUE, buy_count)`
- `groceries_purchase_log(name, normalized_name, bought_at)` (no unique key)
- `groceries_product_aisles(normalized_name, shop_id, aisle_id, last_used, PK(normalized_name, shop_id))`
- `groceries_ingredient_aliases(normalized_alias PK, canonical_name, updated_at)`
- `groceries_items(id, name, ...)` (no unique key)

Duplicate names fragment purchase counts, split the purchase log (so recency
hints misfire), and scatter aisle mappings. `groceries_ingredient_aliases` can
canonicalize *future* imports, but it does not reconcile history that already
exists under two spellings.

## Decision

### An admin-only merge tool over existing candidate names

`/groceries/admin` (reachable from a floating `AdminButton` on
`/groceries/planning`) uses a **staged selection flow** suited to large
catalogs: a **search field** filters a results list, clicking a result **adds it
to a staging list** above, clicking a staged row **selects it as the target**
(representative), and a **two-click button** confirms. The **first** added item
becomes the target automatically; removing the target falls back to the next
staged item. The target MUST be an existing candidate — no brand-new typed name —
because the merge cannot invent a display name or history. Staged rows carry a
per-row remove control. Confirmation is a **two-click button** (first click arms,
second confirms) to prevent destructive mis-clicks.

`listMergeCandidates` builds the candidate set as the union of
`groceries_product_counts.name`, distinct `groceries_items.name`, and distinct
`groceries_ingredient_aliases.canonical_name`, deduped by
`normalizeProductName`. Display-name preference is counts > items > alias
canonical; `buyCount` comes from the counts row (else 0); `onList` marks names
present in `groceries_items`.

### Merge semantics (one transaction)

`mergeGroceryProducts(targetName, sourceNames)` dedupes normalized source names
and drops any equal to the target, then runs a single `db.transaction`:

1. **Counts** — sum source `buy_count` onto the target row (insert one if the
   target has no history), then delete the source rows.
2. **Purchase log** — rewrite source rows to the target `name`/`normalized_name`,
   so `getRecentlyBought` returns the newest source purchase.
3. **Aisles** — per shop: if the target already has a mapping, delete the source
   rows for that shop; otherwise keep the most recently used source row, re-key
   it to the target, and delete the rest. This preserves the existing
   `(normalized_name, shop_id)` primary key with no collision.
4. **Aliases** — `saveIngredientAlias(sourceName, targetName)` for each source
   display name (so future imports canonicalize), then re-point any existing
   alias whose `canonical_name` normalized matches a source.
5. **Items** — rename matching `groceries_items.name` values only. Amount and
   unit are untouched; `groceries_item_aisles` is id-keyed and needs no change.

### API and UI

- `GET /api/groceries/admin` returns `{ products: MergeCandidate[] }` sorted by
  buy count DESC then Polish locale name.
- `POST /api/groceries/admin` accepts `{ target, sources }`, validates both
  against the current candidates, and returns `201 { merged, target }`. Errors
  return `{ message }` (not `{ error }`) so `apiRequest` surfaces the text.
- The component renders rows inline (no child `component$` in the mapped lists),
  keeps a stable JSX tree, and reassigns signals immutably. The staging list sits
  above the search field and all-products results list; results exclude already
  staged names.

### Manual-add canonicalization

Manual **add** (`POST /api/groceries`) resolves the trimmed name through aliases
(`resolveCanonical(normalizeProductName(name)) ?? name`) and stores the canonical
name silently, using it for both `createGroceryItem` and `saveProductAisle`.
Manual **rename** (`PATCH /api/groceries/[id]`) stays literal: a rename is an
explicit user intent and must not be silently rewritten.

## Alternatives considered

- **A persisted "canonical product" table with IDs.** A larger refactor of every
  name-keyed table; the normalize-key approach already exists and the alias
  layer covers future imports. Rejected for now.
- **Typing a brand-new target name.** Would create counts/aisles with no history
  and no candidate anchor; rejected because the user should pick a real product.
- **Combining amounts of active list items.** Two `1 kg` rows of the same product
  become two `1 kg` rows, not `2 kg`; merging quantities needs unit conversion
  and doubles the blast radius. Out of scope — rename only.
- **Canonicalizing on rename too.** A rename is often a deliberate
  reclassification; silently mapping it through aliases would fight the user.
  Rejected.
- **Learning aliases from all merge sources automatically.** Done, because the
  target is an existing known product and the sources are exact prior spellings;
  this is the same guard as ADR-035's import learning.

## Consequences

- No migration: the feature is data-only and constrained by existing keys.
- Purchase counts become correct after historical merges; recency hints and
  per-shop aisle suggestions follow the merged name.
- Source spellings become aliases, so imports and manual adds of those spellings
  land on the target; manual renames remain literal.
- The merge is destructive for the source rows and irreversible from the UI. The
  two-click confirm is the only guard; power users can still re-create a name by
  adding it manually.
