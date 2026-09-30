import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";
import { createGroceryItem, incrementGroceryItemCount } from "./groceries.ts";
import {
  logPurchase,
  getRecentlyBought,
  saveIngredientAlias,
  resolveCanonical,
  findProductMatches,
  buildCatalog,
} from "./groceries-import.ts";
import {
  getInventoryWindowDays,
  setInventoryWindowDays,
} from "./settings.ts";

function freshDb(): Database.Database {
  const db = new Database(":memory:");
  runMigrations(db);
  return db;
}

test("logPurchase then getRecentlyBought returns fresh purchases only", () => {
  const db = freshDb();

  logPurchase("Mleko", db);
  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO groceries_purchase_log (name, normalized_name, bought_at) VALUES (?, ?, ?)",
  ).run("Chleb", "chleb", now - 100 * 86400);

  const fresh = getRecentlyBought(["mleko", "chleb"], 30, db);
  expect(fresh.has("mleko")).toBe(true);
  expect(fresh.has("chleb")).toBe(false);

  const wide = getRecentlyBought(["mleko", "chleb"], 200, db);
  expect(wide.has("chleb")).toBe(true);

  expect(getRecentlyBought([], 30, db).size).toBe(0);
  db.close();
});

test("saveIngredientAlias / resolveCanonical normalizes the alias", () => {
  const db = freshDb();

  saveIngredientAlias("Cebule", "cebula", db);
  expect(resolveCanonical("  CEBULE ", db)).toBe("cebula");
  expect(resolveCanonical("nieznane", db)).toBeNull();

  saveIngredientAlias("cebule", "cebula biała", db);
  expect(resolveCanonical("cebule", db)).toBe("cebula biała");
  db.close();
});

test("findProductMatches returns exact and fuzzy matches", () => {
  const db = freshDb();
  incrementGroceryItemCount("Cebula", db);
  incrementGroceryItemCount("Marchewka", db);

  const exact = findProductMatches("cebula", db);
  expect(exact[0]).toEqual({ name: "Cebula", confidence: 1 });

  const fuzzy = findProductMatches("cebule", db);
  const cebula = fuzzy.find((m) => m.name === "Cebula");
  expect(cebula).toBeDefined();
  expect(cebula!.confidence).toBeGreaterThanOrEqual(0.6);
  expect(cebula!.confidence).toBeLessThan(1);

  expect(findProductMatches("", db)).toHaveLength(0);
  db.close();
});

test("buildCatalog dedupes by normalized name across sources", () => {
  const db = freshDb();
  incrementGroceryItemCount("Milk", db);
  createGroceryItem("milk", null, false, 1, "x", db);
  saveIngredientAlias("mléko", "Mleko", db);

  const catalog = buildCatalog(db);
  const matches = catalog.filter((e) => e.normalized === "milk");
  expect(matches).toHaveLength(1);
  db.close();
});

test("incrementGroceryItemCount also records a purchase", () => {
  const db = freshDb();
  incrementGroceryItemCount("Jajka", db);
  incrementGroceryItemCount("jajka", db);

  const row = db
    .prepare("SELECT COUNT(*) AS n FROM groceries_purchase_log WHERE normalized_name = ?")
    .get("jajka") as { n: number };
  expect(row.n).toBe(2);
  db.close();
});

test("inventory window setting defaults, persists, and clamps", () => {
  const db = freshDb();

  expect(getInventoryWindowDays("default", db)).toBe(15);

  setInventoryWindowDays(14, db);
  expect(getInventoryWindowDays("default", db)).toBe(14);

  setInventoryWindowDays(0, db);
  expect(getInventoryWindowDays("default", db)).toBe(1);

  setInventoryWindowDays(9999, db);
  expect(getInventoryWindowDays("default", db)).toBe(15);
  db.close();
});
