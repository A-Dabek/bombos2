import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { normalizeProductName } from "../utils/groceries.ts";
export { normalizeProductName };

export interface GroceryItem {
  id: number;
  name: string;
  description: string | null;
  urgent: boolean;
  bought: boolean;
  created_at: number;
  amount: number;
  unit: string;
  aisleId?: number | null;
}

const ITEM_COLUMNS =
  "id, name, description, urgent, bought, created_at, amount, unit";

function rowToItem(row: unknown[]): GroceryItem {
  return {
    id: row[0] as number,
    name: row[1] as string,
    description: row[2] as string | null,
    urgent: (row[3] as number) === 1,
    bought: (row[4] as number) === 1,
    created_at: row[5] as number,
    amount: row[6] as number,
    unit: row[7] as string,
  };
}

export function getGroceryItems(db?: Database.Database): GroceryItem[] {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare(`SELECT ${ITEM_COLUMNS} FROM groceries_items ORDER BY id`)
    .raw(true)
    .all() as unknown[][];
  return rows.map(rowToItem);
}

export function getGroceryItemById(
  id: number,
  db?: Database.Database,
): GroceryItem | undefined {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare(`SELECT ${ITEM_COLUMNS} FROM groceries_items WHERE id = ?`)
    .raw(true)
    .all(id) as unknown[][];
  if (rows.length === 0) return undefined;
  return rowToItem(rows[0]);
}

export function createGroceryItem(
  name: string,
  description: string | null,
  urgent: boolean,
  amount: number,
  unit: string,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare(
      "INSERT INTO groceries_items (name, description, urgent, amount, unit) VALUES (?, ?, ?, ?, ?)",
    )
    .run(name, description, urgent ? 1 : 0, amount, unit);
  return result.lastInsertRowid as number;
}

export function updateGroceryItem(
  id: number,
  name: string,
  description: string | null,
  urgent: boolean,
  amount: number,
  unit: string,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare(
      "UPDATE groceries_items SET name = ?, description = ?, urgent = ?, amount = ?, unit = ? WHERE id = ?",
    )
    .run(name, description, urgent ? 1 : 0, amount, unit, id);
  return result.changes > 0;
}

export function setGroceryItemBought(
  id: number,
  bought: boolean,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare("UPDATE groceries_items SET bought = ? WHERE id = ?")
    .run(bought ? 1 : 0, id);
  return result.changes > 0;
}

export function updateGroceryItemAmount(
  id: number,
  amount: number,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare("UPDATE groceries_items SET amount = ? WHERE id = ?")
    .run(amount, id);
  return result.changes > 0;
}

export function deleteGroceryItem(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const item = getGroceryItemById(id, dbConn);
  if (item && item.bought) {
    incrementGroceryItemCount(item.name, dbConn);
  }
  dbConn.prepare("DELETE FROM groceries_item_aisles WHERE item_id = ?").run(id);
  const result = dbConn.prepare("DELETE FROM groceries_items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllGroceryItems(db?: Database.Database): number {
  const dbConn = db ?? getDb();
  dbConn.prepare("DELETE FROM groceries_item_aisles").run();
  const result = dbConn.prepare("DELETE FROM groceries_items").run();
  return result.changes;
}

export function deleteBoughtGroceryItems(db?: Database.Database): number {
  const dbConn = db ?? getDb();
  const boughtItems = dbConn
    .prepare("SELECT id, name FROM groceries_items WHERE bought = 1")
    .all() as { id: number; name: string }[];
  for (const item of boughtItems) {
    incrementGroceryItemCount(item.name, dbConn);
  }
  if (boughtItems.length > 0) {
    const placeholders = boughtItems.map(() => "?").join(", ");
    dbConn
      .prepare(
        `DELETE FROM groceries_item_aisles WHERE item_id IN (${placeholders})`,
      )
      .run(...boughtItems.map((item) => item.id));
  }
  const result = dbConn.prepare("DELETE FROM groceries_items WHERE bought = 1").run();
  return result.changes;
}

export function incrementGroceryItemCount(
  name: string,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  dbConn
    .prepare(
      `
    INSERT INTO groceries_product_counts (name, normalized_name, buy_count)
    VALUES (?, ?, 1)
    ON CONFLICT(normalized_name) DO UPDATE SET buy_count = buy_count + 1
  `,
    )
    .run(name, normalized);
}

export function getTopGrocerySuggestions(
  limit: number = 10,
  db?: Database.Database,
): { name: string; buy_count: number }[] {
  const dbConn = db ?? getDb();
  return dbConn
    .prepare(
      "SELECT name, buy_count FROM groceries_product_counts ORDER BY buy_count DESC LIMIT ?",
    )
    .all(limit) as { name: string; buy_count: number }[];
}
