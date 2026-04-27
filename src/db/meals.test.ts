import { getMealsByCategory, createMeal, deleteMeal, MealRow } from "./meals.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("getMealsByCategory returns 33 rows for dinner", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const meals = getMealsByCategory("dinner", db);
  expect(meals).toHaveLength(33);
  expect(meals[0].name).toBe("Potrawka");
  expect(meals[1].name).toBe("Kotlety z fasoli");
  expect(meals[32].name).toBe("Naleśniki ze szpinakiem");

  db.close();
});

test("getMealsByCategory returns 20 rows for supper", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const meals = getMealsByCategory("supper", db);
  expect(meals).toHaveLength(20);
  expect(meals[0].name).toBe("Warzywa z humusem");
  expect(meals[19].name).toBe("Tosty");

  db.close();
});

test("createMeal inserts a new meal", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createMeal("dinner", "Test Dish", db);
  expect(id).toBeGreaterThan(0);

  const meals = getMealsByCategory("dinner", db);
  const found = meals.find((m) => m.name === "Test Dish");
  expect(found).toBeDefined();

  db.close();
});

test("deleteMeal removes a meal", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const id = createMeal("dinner", "To Delete", db);
  const deleted = deleteMeal(id, db);
  expect(deleted).toBe(true);

  const meals = getMealsByCategory("dinner", db);
  const found = meals.find((m) => m.name === "To Delete");
  expect(found).toBeUndefined();

  db.close();
});