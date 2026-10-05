import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";
import {
  createGroceryItem,
  getGroceryItemById,
  normalizeProductName,
} from "./groceries.ts";
import { getRecentlyBought, saveIngredientAlias, resolveCanonical } from "./groceries-import.ts";
import { createShop } from "./shops.ts";
import { listMergeCandidates, mergeGroceryProducts } from "./groceries-merge.ts";

const TARGET = "Pierś z kurczaka";
const SOURCE_A = "Filet z piersi kurczaka";
const SOURCE_B = "Kurczak pierś";

function freshDb(): Database.Database {
  const db = new Database(":memory:");
  runMigrations(db);
  return db;
}

function addCount(db: Database.Database, name: string, count: number): void {
  db.prepare(
    "INSERT INTO groceries_product_counts (name, normalized_name, buy_count) VALUES (?, ?, ?)",
  ).run(name, normalizeProductName(name), count);
}

test("listMergeCandidates dedupes across sources and sorts by buy count", () => {
  const db = freshDb();
  addCount(db, TARGET, 5);
  addCount(db, SOURCE_B, 1);
  createGroceryItem(SOURCE_A, null, false, 1, "x", db);
  saveIngredientAlias("kurczak", TARGET, db);

  const candidates = listMergeCandidates(db);
  const normalized = candidates.map((c) => c.normalized);

  expect(new Set(normalized).size).toBe(normalized.length);
  expect(candidates[0]).toMatchObject({ name: TARGET, buyCount: 5 });

  const filet = candidates.find((c) => c.normalized === normalizeProductName(SOURCE_A));
  expect(filet).toMatchObject({ name: SOURCE_A, buyCount: 0, onList: true });

  const aliasCanonical = candidates.find((c) => c.name === TARGET);
  expect(aliasCanonical?.onList).toBe(false);

  const counts = candidates.map((c) => c.buyCount);
  expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  db.close();
});

test("merge sums buy counts and deletes source count rows", () => {
  const db = freshDb();
  addCount(db, TARGET, 5);
  addCount(db, SOURCE_A, 2);
  addCount(db, SOURCE_B, 1);

  const result = mergeGroceryProducts(TARGET, [SOURCE_A, SOURCE_B], db);
  expect(result).toEqual({ merged: 2, target: TARGET });

  const rows = db
    .prepare("SELECT name, normalized_name, buy_count FROM groceries_product_counts")
    .all() as { name: string; normalized_name: string; buy_count: number }[];
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    name: TARGET,
    normalized_name: normalizeProductName(TARGET),
    buy_count: 8,
  });
  db.close();
});

test("merge creates a target count row when none exists", () => {
  const db = freshDb();
  addCount(db, SOURCE_A, 2);
  addCount(db, SOURCE_B, 3);

  mergeGroceryProducts(TARGET, [SOURCE_A, SOURCE_B], db);

  const row = db
    .prepare(
      "SELECT name, buy_count FROM groceries_product_counts WHERE normalized_name = ?",
    )
    .get(normalizeProductName(TARGET)) as { name: string; buy_count: number };
  expect(row.name).toBe(TARGET);
  expect(row.buy_count).toBe(5);
  db.close();
});

test("merge rewrites purchase log so recency reflects the newest source", () => {
  const db = freshDb();
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO groceries_purchase_log (name, normalized_name, bought_at) VALUES (?, ?, ?)",
  ).run(SOURCE_A, normalizeProductName(SOURCE_A), now - 200);
  db.prepare(
    "INSERT INTO groceries_purchase_log (name, normalized_name, bought_at) VALUES (?, ?, ?)",
  ).run(SOURCE_B, normalizeProductName(SOURCE_B), now - 100);

  mergeGroceryProducts(TARGET, [SOURCE_A, SOURCE_B], db);

  const targetNorm = normalizeProductName(TARGET);
  const remaining = db
    .prepare("SELECT COUNT(*) AS n FROM groceries_purchase_log WHERE normalized_name = ?")
    .get(targetNorm) as { n: number };
  expect(remaining.n).toBe(2);

  const recent = getRecentlyBought([TARGET], 30, db);
  expect(recent.get(targetNorm)).toBe(now - 100);
  db.close();
});

test("merge keeps target aisle and dedupes per-shop source aisles", () => {
  const db = freshDb();
  const shop2 = createShop("Biedronka", db);
  const insertAisle = db.prepare(
    "INSERT INTO groceries_product_aisles (normalized_name, shop_id, aisle_id, last_used) VALUES (?, ?, ?, ?)",
  );
  const targetNorm = normalizeProductName(TARGET);
  const aNorm = normalizeProductName(SOURCE_A);
  const bNorm = normalizeProductName(SOURCE_B);

  insertAisle.run(targetNorm, 1, 10, 100);
  insertAisle.run(aNorm, 1, 20, 5);
  insertAisle.run(bNorm, 1, 30, 50);
  insertAisle.run(aNorm, shop2, 99, 10);
  insertAisle.run(bNorm, shop2, 88, 50);

  mergeGroceryProducts(TARGET, [SOURCE_A, SOURCE_B], db);

  const shop1 = db
    .prepare(
      "SELECT aisle_id FROM groceries_product_aisles WHERE normalized_name = ? AND shop_id = 1",
    )
    .all(targetNorm) as { aisle_id: number }[];
  expect(shop1).toEqual([{ aisle_id: 10 }]);

  const shop2Rows = db
    .prepare(
      "SELECT aisle_id, last_used FROM groceries_product_aisles WHERE normalized_name = ? AND shop_id = ?",
    )
    .all(targetNorm, shop2) as { aisle_id: number; last_used: number }[];
  expect(shop2Rows).toEqual([{ aisle_id: 88, last_used: 50 }]);

  const leftover = db
    .prepare(
      `SELECT COUNT(*) AS n FROM groceries_product_aisles WHERE normalized_name IN (?, ?)`,
    )
    .get(aNorm, bNorm) as { n: number };
  expect(leftover.n).toBe(0);
  db.close();
});

test("merge creates source aliases and re-points aliases of a source", () => {
  const db = freshDb();
  addCount(db, TARGET, 1);
  addCount(db, SOURCE_A, 1);
  addCount(db, SOURCE_B, 1);
  saveIngredientAlias("drób", SOURCE_B, db);

  mergeGroceryProducts(TARGET, [SOURCE_A, SOURCE_B], db);

  expect(resolveCanonical(normalizeProductName(SOURCE_A), db)).toBe(TARGET);
  expect(resolveCanonical(normalizeProductName(SOURCE_B), db)).toBe(TARGET);
  expect(resolveCanonical("drób", db)).toBe(TARGET);
  db.close();
});

test("merge renames source list items without touching amount or unit", () => {
  const db = freshDb();
  addCount(db, TARGET, 1);
  const id = createGroceryItem(SOURCE_A, "opis", true, 2.5, "kg", db);
  const otherId = createGroceryItem("Mleko", null, false, 1, "x", db);

  mergeGroceryProducts(TARGET, [SOURCE_A], db);

  const renamed = getGroceryItemById(id, db);
  expect(renamed?.name).toBe(TARGET);
  expect(renamed?.amount).toBe(2.5);
  expect(renamed?.unit).toBe("kg");
  expect(renamed?.description).toBe("opis");
  expect(renamed?.urgent).toBe(true);

  const untouched = getGroceryItemById(otherId, db);
  expect(untouched?.name).toBe("Mleko");
  db.close();
});

test("merge with no sources or only the target is a no-op", () => {
  const db = freshDb();
  addCount(db, TARGET, 5);
  createGroceryItem(TARGET, null, false, 1, "x", db);

  expect(mergeGroceryProducts(TARGET, [], db)).toEqual({ merged: 0, target: TARGET });
  expect(mergeGroceryProducts(TARGET, [TARGET, `  ${TARGET}  `], db)).toEqual({
    merged: 0,
    target: TARGET,
  });

  const count = db
    .prepare("SELECT buy_count FROM groceries_product_counts WHERE normalized_name = ?")
    .get(normalizeProductName(TARGET)) as { buy_count: number };
  expect(count.buy_count).toBe(5);
  db.close();
});
