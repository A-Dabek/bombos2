import {
  getGroceryItems,
  getGroceryItemById,
  createGroceryItem,
  updateGroceryItem,
  setGroceryItemBought,
  deleteGroceryItem,
  deleteAllGroceryItems,
  updateGroceryItemAmount,
} from "./groceries.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("getGroceryItems returns all items ordered by id", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.exec("DELETE FROM groceries_items");

  createGroceryItem("Milk", "1L", false, 1, "l", db);
  createGroceryItem("Bread", null, true, 2, "x", db);

  const items = getGroceryItems(db);
  expect(items).toHaveLength(2);
  expect(items[0].name).toBe("Milk");
  expect(items[0].amount).toBe(1);
  expect(items[0].unit).toBe("l");
  expect(items[1].name).toBe("Bread");
  expect(items[1].amount).toBe(2);
  expect(items[1].unit).toBe("x");
  expect(items[1].urgent).toBe(true);

  db.close();
});

test("createGroceryItem inserts a new item", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Eggs", "10 pack", false, 1, "x", db);
  expect(id).toBeGreaterThan(0);

  const items = getGroceryItems(db);
  const found = items.find((i) => i.name === "Eggs");
  expect(found).toBeDefined();
  expect(found?.description).toBe("10 pack");
  expect(found?.urgent).toBe(false);
  expect(found?.bought).toBe(false);
  expect(found?.amount).toBe(1);
  expect(found?.unit).toBe("x");

  db.close();
});

test("getGroceryItemById returns item by id", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Butter", null, false, 250, "g", db);
  const item = getGroceryItemById(id, db);
  expect(item).toBeDefined();
  expect(item?.name).toBe("Butter");
  expect(item?.amount).toBe(250);
  expect(item?.unit).toBe("g");

  const nonExistent = getGroceryItemById(999, db);
  expect(nonExistent).toBeUndefined();

  db.close();
});

test("updateGroceryItem updates item fields", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Apple", "Green", false, 5, "x", db);
  const updated = updateGroceryItem(id, "Red Apple", "Sweet", true, 1.5, "kg", db);
  expect(updated).toBe(true);

  const item = getGroceryItemById(id, db);
  expect(item?.name).toBe("Red Apple");
  expect(item?.description).toBe("Sweet");
  expect(item?.urgent).toBe(true);
  expect(item?.amount).toBe(1.5);
  expect(item?.unit).toBe("kg");

  db.close();
});

test("setGroceryItemBought toggles bought status", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Water", null, false, 1.5, "l", db);
  expect(getGroceryItemById(id, db)?.bought).toBe(false);

  setGroceryItemBought(id, true, db);
  expect(getGroceryItemById(id, db)?.bought).toBe(true);

  setGroceryItemBought(id, false, db);
  expect(getGroceryItemById(id, db)?.bought).toBe(false);

  db.close();
});

test("deleteGroceryItem removes an item", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Cookie", null, false, 12, "x", db);
  const deleted = deleteGroceryItem(id, db);
  expect(deleted).toBe(true);

  const items = getGroceryItems(db);
  expect(items.find((i) => i.id === id)).toBeUndefined();

  db.close();
});

test("deleteAllGroceryItems removes all items", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.exec("DELETE FROM groceries_items");

  createGroceryItem("A", null, false, 1, "x", db);
  createGroceryItem("B", null, false, 1, "x", db);
  createGroceryItem("C", null, false, 1, "x", db);

  const count = deleteAllGroceryItems(db);
  expect(count).toBe(3);

  const items = getGroceryItems(db);
  expect(items).toHaveLength(0);

  db.close();
});

test("updateGroceryItemAmount updates only the amount", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Juice", null, false, 1, "l", db);
  const updated = updateGroceryItemAmount(id, 2.5, db);
  expect(updated).toBe(true);

  const item = getGroceryItemById(id, db);
  expect(item?.name).toBe("Juice");
  expect(item?.amount).toBe(2.5);
  expect(item?.unit).toBe("l");

  db.close();
});
