import {
  createGroceryItem,
  setGroceryItemBought,
  deleteGroceryItem,
  deleteBoughtGroceryItems,
  getTopGrocerySuggestions,
  incrementGroceryItemCount,
  saveProductCategory,
} from "./groceries.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("incrementGroceryItemCount increases buy count and handles normalization", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  incrementGroceryItemCount("Milk", db);
  incrementGroceryItemCount("milk", db);
  incrementGroceryItemCount("  MILK  ", db);

  const suggestions = getTopGrocerySuggestions(10, db);
  expect(suggestions).toHaveLength(1);
  expect(suggestions[0].name).toBe("Milk"); // Keeps the first name used? Actually INSERT OR IGNORE would keep first. 
  // Let's check my implementation: INSERT ... ON CONFLICT DO UPDATE SET buy_count = buy_count + 1
  // So it keeps the first 'name'.
  expect(suggestions[0].buy_count).toBe(3);

  db.close();
});

test("deleteGroceryItem increments count only if item was bought", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id1 = createGroceryItem("Apple", null, false, 1, "x", null, db);
  const id2 = createGroceryItem("Banana", null, false, 1, "x", null, db);

  setGroceryItemBought(id1, true, db);
  // id2 is not bought

  deleteGroceryItem(id1, db);
  deleteGroceryItem(id2, db);

  const suggestions = getTopGrocerySuggestions(10, db);
  expect(suggestions).toHaveLength(1);
  expect(suggestions[0].name).toBe("Apple");
  expect(suggestions[0].buy_count).toBe(1);

  db.close();
});

test("deleteBoughtGroceryItems increments count for all bought items", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  createGroceryItem("Milk", null, false, 1, "x", null, db);
  createGroceryItem("Bread", null, false, 1, "x", null, db);
  createGroceryItem("Butter", null, false, 1, "x", null, db);

  const items = db.prepare("SELECT id, name FROM groceries_items").all() as { id: number, name: string }[];
  setGroceryItemBought(items.find(i => i.name === "Milk")!.id, true, db);
  setGroceryItemBought(items.find(i => i.name === "Bread")!.id, true, db);
  // Butter is not bought

  deleteBoughtGroceryItems(db);

  const suggestions = getTopGrocerySuggestions(10, db);
  expect(suggestions).toHaveLength(2);
  const milk = suggestions.find(s => s.name === "Milk");
  const bread = suggestions.find(s => s.name === "Bread");
  expect(milk).toBeDefined();
  expect(bread).toBeDefined();
  expect(suggestions.find(s => s.name === "Butter")).toBeUndefined();

  db.close();
});

test("getTopGrocerySuggestions returns items with categories", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  saveProductCategory("Milk", "Dairy", db);
  incrementGroceryItemCount("Milk", db);

  const suggestions = getTopGrocerySuggestions(10, db);
  expect(suggestions[0].name).toBe("Milk");
  expect(suggestions[0].category).toBe("Dairy");

  db.close();
});

test("getTopGrocerySuggestions limits results", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  for (let i = 0; i < 15; i++) {
    incrementGroceryItemCount(`Item ${i}`, db);
  }

  const suggestions = getTopGrocerySuggestions(10, db);
  expect(suggestions).toHaveLength(10);

  db.close();
});
