import { getMealsByCategory, MealRow } from "./meals.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("getMealsByCategory returns 0 rows for breakfast (no seed data)", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const meals = getMealsByCategory("breakfast", db);
  expect(meals).toHaveLength(0);

  db.close();
});

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