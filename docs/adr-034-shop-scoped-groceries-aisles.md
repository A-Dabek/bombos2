# ADR-034: Per-Shop Groceries Aisles (supersedes ADR-030)

## Status

Accepted (2026-09-24) — supersedes [ADR-030: Groceries Categories](adr-030-groceries-categories.md).

## Context

ADR-030 modelled groceries organization as a single global, free-text
`groceries_items.category` column plus a product-name → category learning table
(`groceries_product_categories`). In practice this was the wrong shape:

- A category had no ordering. Shopping is a **walk through a store**, so the
  useful order is each market's own aisle sequence, and different markets order
  aisles differently.
- Categories were global, so a product's placement could not differ between
  shops even though "mleko" lives in a different place in Lidl vs. Biedronka.
- The item form auto-filled the category but never cleared it when the name
  changed, causing a suggestion learned for product A to be saved (and the
  learned mapping to be overwritten) for product B — the "stale category" bug.

Migration `031_clear_groceries_categories.sql` had already NULLed every
`groceries_items.category` and emptied both category tables, so retiring them is
lossless.

## Decision

### A shop is a named, ordered list of aisles

`shops` holds named shops. `shop_aisles` holds each shop's aisles with a
`sort_order`. The aisle is the category; there is no 2-D grid.

### An item has one placement per shop

`groceries_item_aisles (item_id, shop_id, aisle_id)` — primary key
`(item_id, shop_id)`. Deleting the item cascades its placements explicitly in
code (SQLite FKs are not enforced in this repo). Deleting an aisle deletes its
placements/learning/completions; affected items simply become unassigned
("Bez alejki"), never deleted.

### A shop is always active

The active shop is a per-user setting (`settings.active_shop`, JSON), defaulting
to the first shop by id when unset. A migration seeds one shop (`Lidl`) and
persists it as active, so there is never a "no shop" state. Deleting the last
shop is blocked. Deleting the active shop reassigns the active shop to the first
remaining one.

### Learning is shop-scoped and manual picks win

`groceries_product_aisles (normalized_name, shop_id, aisle_id)` learns a
product's aisle per shop. The write carries a `manual` flag:

- manual pick → `ON CONFLICT(normalized_name, shop_id) DO UPDATE`
- auto suggestion → `ON CONFLICT(normalized_name, shop_id) DO NOTHING`

Auto suggestions can therefore never overwrite an existing learned mapping. The
form tracks `aisleSource: "none" | "auto" | "manual"`; on a name change an
auto-suggested aisle is cleared and re-requested, and a manual pick is never
clobbered. This is the durable fix for the stale-category bug.

### Aisle completion is per shop

`groceries_completed_aisles (shop_id, aisle_id)` replaces the global completed
categories. The shopping list walks aisles in `sort_order`, puts completed
aisles at the bottom, and prompts "Gdzie to znalazłeś?" when an unassigned item
is marked bought, letting the placement be recorded on the spot.

## Alternatives considered

- **Keep global free-text categories, add a per-shop order table.** Aisle order
  without per-shop placement still cannot express that a product sits in
  different aisles in different shops, and keeps the stale-autofill bug.
- **Free-text aisle names per item.** Loses ordering, counts, and dedupe; the
  ordered `shop_aisles` list is what enables walk-order grouping.
- **Enforce FKs with `PRAGMA foreign_keys`.** Out of scope; this repo deliberately
  performs cascades explicitly in code.

## Consequences

- `groceries_items.category` is dropped (migration
  `033_retire_groceries_categories.sql`); `groceries_product_categories` and
  `groceries_completed_categories` are dropped.
- API responses carry `aisleId` (null when unassigned), scoped by `?shop=`.
- The UI adds a "Sklepy" tab for shop/aisle CRUD, an aisle `<select>` (with
  "Bez alejki") in the item form, aisle-ordered planning and shopping views, and
  an aisle-prompt when buying unassigned items.
- Aisle-delete warnings use the count of **all** placed items (not
  unbought-only).
