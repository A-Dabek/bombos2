import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface MealRow {
  id: number;
  category: "dinner" | "supper";
  name: string;
}

export function getMealsByCategory(
  category: "dinner" | "supper",
  db?: Database.Database,
): MealRow[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, category, name FROM meals WHERE category = ? ORDER BY id",
  ).raw(true).all(category) as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    category: row[1] as "dinner" | "supper",
    name: row[2] as string,
  }));
}

export function createMeal(
  category: "dinner" | "supper",
  name: string,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO meals (category, name) VALUES (?, ?)",
  ).run(category, name);
  return result.lastInsertRowid as number;
}

export function deleteMeal(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM meals WHERE id = ?").run(id);
  return result.changes > 0;
}