import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface MealRow {
  id: number;
  category: "breakfast" | "dinner" | "supper";
  name: string;
}

export function getMealsByCategory(
  category: "breakfast" | "dinner" | "supper",
  db?: Database.Database,
): MealRow[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, category, name FROM meals WHERE category = ? ORDER BY id",
  ).raw(true).all(category) as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    category: row[1] as "breakfast" | "dinner" | "supper",
    name: row[2] as string,
  }));
}