import {
  getGroceryItems,
  getGroceryItemById,
  createGroceryItem,
  updateGroceryItem,
  setGroceryItemBought,
  deleteGroceryItem,
  deleteAllGroceryItems,
  updateGroceryItemAmount,
  normalizeProductName,
  getSuggestedCategory,
  saveProductCategory,
  getAllCategories,
} from "./groceries.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("getGroceryItems returns all items ordered by id", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.exec("DELETE FROM groceries_items");

  createGroceryItem("Milk", "1L", false, 1, "l", "Nabiał", db);
  createGroceryItem("Bread", null, true, 2, "x", "Pieczywo", db);

  const items = getGroceryItems(db);
  expect(items).toHaveLength(2);
  expect(items[0].name).toBe("Milk");
  expect(items[0].category).toBe("Nabiał");
  expect(items[1].name).toBe("Bread");
  expect(items[1].category).toBe("Pieczywo");

  db.close();
});

test("createGroceryItem inserts a new item", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Eggs", "10 pack", false, 1, "x", null, db);
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

  const id = createGroceryItem("Butter", null, false, 250, "g", "Nabiał", db);
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

  const id = createGroceryItem("Apple", "Green", false, 5, "x", "Owoce", db);
  const updated = updateGroceryItem(id, "Red Apple", "Sweet", true, 1.5, "kg", "Owoce i Warzywa", db);
  expect(updated).toBe(true);

  const item = getGroceryItemById(id, db);
  expect(item?.name).toBe("Red Apple");
  expect(item?.category).toBe("Owoce i Warzywa");

  db.close();
});

test("setGroceryItemBought toggles bought status", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Water", null, false, 1.5, "l", "Napoje", db);
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

  const id = createGroceryItem("Cookie", null, false, 12, "x", "Słodycze", db);
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

  createGroceryItem("A", null, false, 1, "x", null, db);
  createGroceryItem("B", null, false, 1, "x", null, db);
  createGroceryItem("C", null, false, 1, "x", null, db);

  const count = deleteAllGroceryItems(db);
  expect(count).toBe(3);

  const items = getGroceryItems(db);
  expect(items).toHaveLength(0);

  db.close();
});

test("updateGroceryItemAmount updates only the amount", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createGroceryItem("Juice", null, false, 1, "l", "Napoje", db);
  const updated = updateGroceryItemAmount(id, 2.5, db);
  expect(updated).toBe(true);

  const item = getGroceryItemById(id, db);
  expect(item?.name).toBe("Juice");
  expect(item?.amount).toBe(2.5);
  expect(item?.unit).toBe("l");

  db.close();
});

test("normalizeProductName lowercases and removes whitespace", () => {
  const { normalizeProductName } = require("./groceries.ts");
  expect(normalizeProductName("  Milk  ")).toBe("milk");
  expect(normalizeProductName("Apple Juice")).toBe("applejuice");
});

test("category suggestions and persistence", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const {
    getSuggestedCategory,
    saveProductCategory,
    getAllCategories,
  } = require("./groceries.ts");

  saveProductCategory("Banana", "Fruits", db);
  expect(getSuggestedCategory("banana", db)).toBe("Fruits");
  expect(getSuggestedCategory("  BANANA  ", db)).toBe("Fruits");

  saveProductCategory("Apple", "Fruits", db);
  saveProductCategory("Milk", "Dairy", db);

  const categories = getAllCategories(db);
  expect(categories).toContain("Fruits");
  expect(categories).toContain("Dairy");
  expect(categories).toHaveLength(2);

  // Auto-save on create
  createGroceryItem("Yogurt", null, false, 1, "x", "Dairy", db);
  expect(getSuggestedCategory("yogurt", db)).toBe("Dairy");

  // Update mapping on update
  const id = createGroceryItem("Bread", null, false, 1, "x", "Bakery", db);
  updateGroceryItem(id, "Bread", null, false, 1, "x", "Fresh Bakery", db);
  expect(getSuggestedCategory("bread", db)).toBe("Fresh Bakery");

  db.close();
});
