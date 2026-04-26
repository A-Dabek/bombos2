import { getMealsByCategory, MealRow } from "./meals.ts";
import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("getMealsByCategory returns exactly 3 rows for breakfast", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const meals = getMealsByCategory("breakfast", db);
  expect(meals).toHaveLength(3);
  expect(meals[0].name).toBe("Scrambled Eggs");
  expect(meals[1].name).toBe("Oatmeal with Berries");
  expect(meals[2].name).toBe("Avocado Toast");

  db.close();
});

test("getMealsByCategory returns exactly 3 rows for dinner", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const meals = getMealsByCategory("dinner", db);
  expect(meals).toHaveLength(3);
  expect(meals[0].name).toBe("Grilled Chicken Salad");
  expect(meals[1].name).toBe("Pasta Carbonara");
  expect(meals[2].name).toBe("Vegetable Stir-Fry");

  db.close();
});

test("getMealsByCategory returns exactly 3 rows for supper", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const meals = getMealsByCategory("supper", db);
  expect(meals).toHaveLength(3);
  expect(meals[0].name).toBe("Greek Yogurt");
  expect(meals[1].name).toBe("Tomato Soup");
  expect(meals[2].name).toBe("Cheese Sandwich");

  db.close();
});