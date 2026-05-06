import {
  getPlanLists,
  getPlanListById,
  createPlanList,
  updatePlanListOrder,
  deletePlanList,
  getPlanItems,
  getPlanItemById,
  createPlanItem,
  updatePlanItem,
  deletePlanItem,
  deleteAllPlanItems,
  PlanList,
  PlanItem,
} from "./plan.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("getPlanLists returns lists in display_order", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.exec("DELETE FROM plan_lists");

  createPlanList("List 1", 1, db);
  createPlanList("List 2", 0, db);
  createPlanList("List 3", 2, db);

  const lists = getPlanLists(db);
  expect(lists).toHaveLength(3);
  expect(lists[0].title).toBe("List 2");
  expect(lists[1].title).toBe("List 1");
  expect(lists[2].title).toBe("List 3");

  db.close();
});

test("createPlanList inserts a new list", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createPlanList("Test List", 0, db);
  expect(id).toBeGreaterThan(0);

  const lists = getPlanLists(db);
  const found = lists.find((l) => l.title === "Test List");
  expect(found).toBeDefined();
  expect(found?.display_order).toBe(0);

  db.close();
});

test("updatePlanListOrder updates order correctly", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id1 = createPlanList("List 1", 0, db);
  const id2 = createPlanList("List 2", 1, db);

  const updated = updatePlanListOrder(id1, 5, db);
  expect(updated).toBe(true);

  const list = getPlanListById(id1, db);
  expect(list?.display_order).toBe(5);

  db.close();
});

test("deletePlanList removes list and cascades to items", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.exec("DELETE FROM plan_lists");

  const listId = createPlanList("Test List", 0, db);
  createPlanItem(listId, "Item 1", "Description 1", false, db);
  createPlanItem(listId, "Item 2", null, false, db);

  const deleted = deletePlanList(listId, db);
  expect(deleted).toBe(true);

  const lists = getPlanLists(db);
  expect(lists).toHaveLength(0);

  const items = getPlanItems(listId, db);
  expect(items).toHaveLength(0);

  db.close();
});

test("getPlanItems returns items for a list", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  createPlanItem(listId, "Item 1", "Desc 1", false, db);
  createPlanItem(listId, "Item 2", "Desc 2", true, db);

  const items = getPlanItems(listId, db);
  expect(items).toHaveLength(2);
  expect(items[0].name).toBe("Item 1");
  expect(items[1].name).toBe("Item 2");
  expect(items[0].urgent).toBe(false);
  expect(items[1].urgent).toBe(true);

  db.close();
});

test("createPlanItem inserts a new item", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  const id = createPlanItem(listId, "New Item", "Description", true, db);
  expect(id).toBeGreaterThan(0);

  const items = getPlanItems(listId, db);
  const found = items.find((i) => i.name === "New Item");
  expect(found).toBeDefined();
  expect(found?.description).toBe("Description");
  expect(found?.urgent).toBe(true);

  db.close();
});

test("createPlanItem with urgent=false defaults correctly", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  const id = createPlanItem(listId, "Regular Item", "Desc", false, db);
  expect(id).toBeGreaterThan(0);

  const item = getPlanItemById(id, db);
  expect(item?.urgent).toBe(false);

  db.close();
});

test("updatePlanItem updates item fields", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  const itemId = createPlanItem(listId, "Original", "Original desc", false, db);

  const updated = updatePlanItem(itemId, "Updated", "Updated desc", true, db);
  expect(updated).toBe(true);

  const item = getPlanItemById(itemId, db);
  expect(item?.name).toBe("Updated");
  expect(item?.description).toBe("Updated desc");
  expect(item?.urgent).toBe(true);

  db.close();
});

test("updatePlanItem can toggle urgent status", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  const itemId = createPlanItem(listId, "Item", "Desc", false, db);

  updatePlanItem(itemId, "Item", "Desc", true, db);
  let item = getPlanItemById(itemId, db);
  expect(item?.urgent).toBe(true);

  updatePlanItem(itemId, "Item", "Desc", false, db);
  item = getPlanItemById(itemId, db);
  expect(item?.urgent).toBe(false);

  db.close();
});

test("deletePlanItem removes an item", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  const itemId = createPlanItem(listId, "To Delete", null, false, db);

  const deleted = deletePlanItem(itemId, db);
  expect(deleted).toBe(true);

  const items = getPlanItems(listId, db);
  expect(items).toHaveLength(0);

  db.close();
});

test("deleteAllPlanItems removes all items from a list", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const listId = createPlanList("Test List", 0, db);
  createPlanItem(listId, "Item 1", null, false, db);
  createPlanItem(listId, "Item 2", null, true, db);
  createPlanItem(listId, "Item 3", null, false, db);

  const count = deleteAllPlanItems(listId, db);
  expect(count).toBe(3);

  const items = getPlanItems(listId, db);
  expect(items).toHaveLength(0);

  db.close();
});