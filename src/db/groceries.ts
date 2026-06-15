import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface GroceryItem {
  id: number;
  name: string;
  description: string | null;
  urgent: boolean;
  bought: boolean;
  created_at: number;
  amount: number;
  unit: string;
  category: string | null;
}

export function getGroceryItems(db?: Database.Database): GroceryItem[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, name, description, urgent, bought, created_at, amount, unit, category FROM groceries_items ORDER BY id",
  ).raw(true).all() as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string | null,
    urgent: (row[3] as number) === 1,
    bought: (row[4] as number) === 1,
    created_at: row[5] as number,
    amount: row[6] as number,
    unit: row[7] as string,
    category: row[8] as string | null,
  }));
}

export function getGroceryItemById(
  id: number,
  db?: Database.Database,
): GroceryItem | undefined {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, name, description, urgent, bought, created_at, amount, unit, category FROM groceries_items WHERE id = ?",
  ).raw(true).all(id) as unknown[][];
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string | null,
    urgent: (row[3] as number) === 1,
    bought: (row[4] as number) === 1,
    created_at: row[5] as number,
    amount: row[6] as number,
    unit: row[7] as string,
    category: row[8] as string | null,
  };
}

export function createGroceryItem(
  name: string,
  description: string | null,
  urgent: boolean,
  amount: number,
  unit: string,
  category: string | null,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO groceries_items (name, description, urgent, amount, unit, category) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(name, description, urgent ? 1 : 0, amount, unit, category);
  
  if (category) {
    saveProductCategory(name, category, dbConn);
  }

  return result.lastInsertRowid as number;
}

export function updateGroceryItem(
  id: number,
  name: string,
  description: string | null,
  urgent: boolean,
  amount: number,
  unit: string,
  category: string | null,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE groceries_items SET name = ?, description = ?, urgent = ?, amount = ?, unit = ?, category = ? WHERE id = ?",
  ).run(name, description, urgent ? 1 : 0, amount, unit, category, id);

  if (category) {
    saveProductCategory(name, category, dbConn);
  }

  return result.changes > 0;
}

export function setGroceryItemBought(
  id: number,
  bought: boolean,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE groceries_items SET bought = ? WHERE id = ?",
  ).run(bought ? 1 : 0, id);
  return result.changes > 0;
}

export function updateGroceryItemAmount(
  id: number,
  amount: number,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE groceries_items SET amount = ? WHERE id = ?",
  ).run(amount, id);
  return result.changes > 0;
}

export function deleteGroceryItem(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM groceries_items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllGroceryItems(db?: Database.Database): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM groceries_items").run();
  clearCompletedCategories(dbConn);
  return result.changes;
}

export function deleteBoughtGroceryItems(db?: Database.Database): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM groceries_items WHERE bought = 1").run();
  clearCompletedCategories(dbConn);
  return result.changes;
}

export function getCompletedCategories(db?: Database.Database): string[] {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare("SELECT category FROM groceries_completed_categories")
    .raw(true)
    .all() as string[][];
  return rows.map((row) => row[0]);
}

export function setCategoryCompleted(
  category: string,
  completed: boolean,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  if (completed) {
    dbConn
      .prepare(
        "INSERT OR IGNORE INTO groceries_completed_categories (category) VALUES (?)",
      )
      .run(category);
  } else {
    dbConn
      .prepare("DELETE FROM groceries_completed_categories WHERE category = ?")
      .run(category);
  }
}

export function clearCompletedCategories(db?: Database.Database): void {
  const dbConn = db ?? getDb();
  dbConn.prepare("DELETE FROM groceries_completed_categories").run();
}

export function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "");
}

export function getSuggestedCategory(
  name: string,
  db?: Database.Database,
): string | null {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  const row = dbConn
    .prepare(
      "SELECT category FROM groceries_product_categories WHERE normalized_name = ?",
    )
    .get(normalized) as { category: string } | undefined;
  return row?.category ?? null;
}

export function saveProductCategory(
  name: string,
  category: string,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  dbConn
    .prepare(
      "INSERT INTO groceries_product_categories (normalized_name, category) VALUES (?, ?) ON CONFLICT(normalized_name) DO UPDATE SET category = EXCLUDED.category",
    )
    .run(normalized, category);
}

export function getAllCategories(db?: Database.Database): string[] {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare(
      "SELECT DISTINCT category FROM groceries_product_categories ORDER BY category",
    )
    .raw(true)
    .all() as string[][];
  return rows.map((row) => row[0]);
}
