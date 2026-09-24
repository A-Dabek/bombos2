import Database from "better-sqlite3";
import { test, expect } from "vitest";
import { runMigrations } from "./migrations.ts";
import {
  getShops,
  getShopById,
  createShop,
  updateShop,
  deleteShop,
  getAisles,
  createAisle,
  updateAisle,
  reorderAisles,
  deleteAisle,
  getAisleItemCounts,
  getItemAisleMap,
  setItemAisle,
  clearItemAisle,
  saveProductAisle,
  getSuggestedAisle,
  getCompletedAisles,
  setAisleCompleted,
} from "./shops.ts";
import { getActiveShop, setActiveShop } from "./settings.ts";
import {
  deleteGroceryItem,
  deleteAllGroceryItems,
  deleteBoughtGroceryItems,
  setGroceryItemBought,
} from "./groceries.ts";

function addItem(db: Database.Database, name: string): number {
  return db
    .prepare("INSERT INTO groceries_items (name) VALUES (?)")
    .run(name).lastInsertRowid as number;
}

test("shop CRUD", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const seeded = getShops(db);
  expect(seeded).toHaveLength(1);
  expect(seeded[0].name).toBe("Lidl");

  const id = createShop("Biedronka", db);
  expect(getShopById(id, db)?.name).toBe("Biedronka");

  expect(updateShop(id, "Biedronka 2", db)).toBe(true);
  expect(getShopById(id, db)?.name).toBe("Biedronka 2");
  expect(updateShop(9999, "X", db)).toBe(false);

  expect(deleteShop(id, db)).toEqual({ ok: true });
  expect(getShopById(id, db)).toBeUndefined();

  db.close();
});

test("last shop cannot be deleted", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const only = getShops(db)[0];
  expect(deleteShop(only.id, db)).toEqual({ ok: false, reason: "last_shop" });

  const second = createShop("Biedronka", db);
  expect(deleteShop(only.id, db)).toEqual({ ok: true });
  expect(deleteShop(second, db)).toEqual({ ok: false, reason: "last_shop" });

  expect(deleteShop(9999, db)).toEqual({ ok: false, reason: "not_found" });

  db.close();
});

test("aisle ordering, rename and reorder", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shop = getShops(db)[0];

  const a = createAisle(shop.id, "Nabiał", db);
  const b = createAisle(shop.id, "Pieczywo", db);
  const c = createAisle(shop.id, "Owoce", db);

  expect(getAisles(shop.id, db).map((x) => x.name)).toEqual([
    "Nabiał",
    "Pieczywo",
    "Owoce",
  ]);

  updateAisle(b, "Pieczywo i bułki", db);
  expect(getAisles(shop.id, db)[1].name).toBe("Pieczywo i bułki");

  reorderAisles(shop.id, [c, a, b], db);
  expect(getAisles(shop.id, db).map((x) => x.id)).toEqual([c, a, b]);

  db.close();
});

test("deleting an aisle unassigns its items and clears history", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shop = getShops(db)[0];
  const aisle = createAisle(shop.id, "Nabiał", db);
  const keep = createAisle(shop.id, "Owoce", db);

  const item = addItem(db, "Milk");
  setItemAisle(item, shop.id, aisle, db);
  saveProductAisle("Milk", shop.id, aisle, true, db);
  setAisleCompleted(shop.id, aisle, true, db);

  expect(deleteAisle(aisle, db)).toBe(true);

  expect(getItemAisleMap(shop.id, db).has(item)).toBe(false);
  expect(getSuggestedAisle("Milk", shop.id, db)).toBeNull();
  expect(getCompletedAisles(shop.id, db)).not.toContain(aisle);
  expect(getAisles(shop.id, db).map((x) => x.id)).toEqual([keep]);

  db.close();
});

test("item placements are scoped per shop", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shopA = getShops(db)[0];
  const shopB = createShop("Biedronka", db);
  const aisleA = createAisle(shopA.id, "Nabiał", db);
  const otherA = createAisle(shopA.id, "Owoce", db);
  const aisleB = createAisle(shopB, "Mleczne", db);
  const item = addItem(db, "Milk");

  setItemAisle(item, shopA.id, aisleA, db);
  expect(getItemAisleMap(shopA.id, db).get(item)).toBe(aisleA);
  expect(getItemAisleMap(shopB, db).has(item)).toBe(false);

  setItemAisle(item, shopB, aisleB, db);
  expect(getItemAisleMap(shopB, db).get(item)).toBe(aisleB);
  expect(getItemAisleMap(shopA.id, db).get(item)).toBe(aisleA);

  setItemAisle(item, shopA.id, otherA, db);
  clearItemAisle(item, shopB, db);
  expect(getItemAisleMap(shopB, db).has(item)).toBe(false);
  expect(getItemAisleMap(shopA.id, db).get(item)).toBe(otherA);

  db.close();
});

test("aisle item counts reflect placements", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shop = getShops(db)[0];
  const aisle = createAisle(shop.id, "Nabiał", db);

  const i1 = addItem(db, "Milk");
  const i2 = addItem(db, "Butter");
  addItem(db, "Bread");
  setItemAisle(i1, shop.id, aisle, db);
  setItemAisle(i2, shop.id, aisle, db);

  expect(getAisleItemCounts(shop.id, db)[aisle]).toBe(2);

  db.close();
});

test("suggest-aisle learns per shop and auto never overwrites", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shopA = getShops(db)[0];
  const shopB = createShop("Biedronka", db);
  const aisleA = createAisle(shopA.id, "Nabiał", db);
  const otherA = createAisle(shopA.id, "Owoce", db);
  const aisleB = createAisle(shopB, "Mleczne", db);

  saveProductAisle("Milk", shopA.id, aisleA, true, db);
  expect(getSuggestedAisle("milk", shopA.id, db)).toBe(aisleA);
  expect(getSuggestedAisle("  MILK ", shopA.id, db)).toBe(aisleA);

  // Auto suggestion must not overwrite a learned mapping.
  saveProductAisle("Milk", shopA.id, otherA, false, db);
  expect(getSuggestedAisle("Milk", shopA.id, db)).toBe(aisleA);

  // Manual pick always wins.
  saveProductAisle("Milk", shopA.id, otherA, true, db);
  expect(getSuggestedAisle("Milk", shopA.id, db)).toBe(otherA);

  // Learning is scoped per shop.
  expect(getSuggestedAisle("Milk", shopB, db)).toBeNull();
  saveProductAisle("Milk", shopB, aisleB, true, db);
  expect(getSuggestedAisle("Milk", shopB, db)).toBe(aisleB);
  expect(getSuggestedAisle("Milk", shopA.id, db)).toBe(otherA);

  db.close();
});

test("completed aisles are scoped per shop", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shopA = getShops(db)[0];
  const shopB = createShop("Biedronka", db);
  const aisleA = createAisle(shopA.id, "Nabiał", db);
  const aisleB = createAisle(shopB, "Mleczne", db);

  setAisleCompleted(shopA.id, aisleA, true, db);
  expect(getCompletedAisles(shopA.id, db)).toContain(aisleA);
  expect(getCompletedAisles(shopB, db)).toHaveLength(0);

  setAisleCompleted(shopB, aisleB, true, db);
  setAisleCompleted(shopA.id, aisleA, false, db);
  expect(getCompletedAisles(shopA.id, db)).not.toContain(aisleA);
  expect(getCompletedAisles(shopB, db)).toContain(aisleB);

  db.close();
});

test("deleting a shop cascades its aisles, placements and history", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shopA = getShops(db)[0];
  const shopB = createShop("Biedronka", db);
  const aisleB = createAisle(shopB, "Mleczne", db);
  const item = addItem(db, "Milk");
  setItemAisle(item, shopB, aisleB, db);
  saveProductAisle("Milk", shopB, aisleB, true, db);
  setAisleCompleted(shopB, aisleB, true, db);

  expect(deleteShop(shopB, db)).toEqual({ ok: true });

  expect(getAisles(shopB, db)).toHaveLength(0);
  expect(getItemAisleMap(shopB, db).size).toBe(0);
  expect(getSuggestedAisle("Milk", shopB, db)).toBeNull();
  expect(getCompletedAisles(shopB, db)).toHaveLength(0);
  expect(getShops(db).map((s) => s.id)).toEqual([shopA.id]);

  db.close();
});

test("deleting items cascades their placements", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shop = getShops(db)[0];
  const aisle = createAisle(shop.id, "Nabiał", db);

  const milk = addItem(db, "Milk");
  const butter = addItem(db, "Butter");
  const bread = addItem(db, "Bread");
  setItemAisle(milk, shop.id, aisle, db);
  setItemAisle(butter, shop.id, aisle, db);
  setItemAisle(bread, shop.id, aisle, db);

  deleteGroceryItem(milk, db);
  expect(getItemAisleMap(shop.id, db).has(milk)).toBe(false);
  expect(getItemAisleMap(shop.id, db).get(butter)).toBe(aisle);

  setGroceryItemBought(butter, true, db);
  deleteBoughtGroceryItems(db);
  expect(getItemAisleMap(shop.id, db).has(butter)).toBe(false);
  expect(getItemAisleMap(shop.id, db).get(bread)).toBe(aisle);

  deleteAllGroceryItems(db);
  expect(getItemAisleMap(shop.id, db).size).toBe(0);

  db.close();
});

test("active shop fallback and reassignment on delete", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  const shopA = getShops(db)[0];

  expect(getActiveShop("default", db)).toBe(shopA.id);

  const shopB = createShop("Biedronka", db);
  setActiveShop(shopB, db);
  expect(getActiveShop("default", db)).toBe(shopB);

  expect(deleteShop(shopB, db)).toEqual({ ok: true });
  expect(getActiveShop("default", db)).toBe(shopA.id);

  db.prepare("DELETE FROM settings WHERE key = 'active_shop'").run();
  expect(getActiveShop("default", db)).toBe(shopA.id);
  const persisted = db
    .prepare("SELECT value FROM settings WHERE key = 'active_shop'")
    .get() as { value: string } | undefined;
  expect(persisted).toBeDefined();
  expect(JSON.parse(persisted!.value)).toBe(shopA.id);

  db.close();
});
