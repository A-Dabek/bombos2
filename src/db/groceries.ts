import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface GroceryItem {
  id: number;
  name: string;
  description: string | null;
  urgent: boolean;
  bought: boolean;
  created_at: number;
}

export function getGroceryItems(db?: Database.Database): GroceryItem[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, name, description, urgent, bought, created_at FROM groceries_items ORDER BY id",
  ).raw(true).all() as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string | null,
    urgent: (row[3] as number) === 1,
    bought: (row[4] as number) === 1,
    created_at: row[5] as number,
  }));
}

export function getGroceryItemById(
  id: number,
  db?: Database.Database,
): GroceryItem | undefined {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, name, description, urgent, bought, created_at FROM groceries_items WHERE id = ?",
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
  };
}

export function createGroceryItem(
  name: string,
  description: string | null,
  urgent: boolean,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO groceries_items (name, description, urgent) VALUES (?, ?, ?)",
  ).run(name, description, urgent ? 1 : 0);
  return result.lastInsertRowid as number;
}

export function updateGroceryItem(
  id: number,
  name: string,
  description: string | null,
  urgent: boolean,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE groceries_items SET name = ?, description = ?, urgent = ? WHERE id = ?",
  ).run(name, description, urgent ? 1 : 0, id);
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

export function deleteGroceryItem(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM groceries_items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllGroceryItems(db?: Database.Database): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM groceries_items").run();
  return result.changes;
}
