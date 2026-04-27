import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export { getDb };

export interface PlanList {
  id: number;
  title: string;
  display_order: number;
  created_at: number;
}

export interface PlanItem {
  id: number;
  list_id: number;
  name: string;
  description: string | null;
  amount: number;
  created_at: number;
}

export function getPlanLists(db?: Database.Database): PlanList[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, title, display_order, created_at FROM plan_lists ORDER BY display_order",
  ).raw(true).all() as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    title: row[1] as string,
    display_order: row[2] as number,
    created_at: row[3] as number,
  }));
}

export function getPlanListById(
  id: number,
  db?: Database.Database,
): PlanList | undefined {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, title, display_order, created_at FROM plan_lists WHERE id = ?",
  ).raw(true).all(id) as unknown[][];
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row[0] as number,
    title: row[1] as string,
    display_order: row[2] as number,
    created_at: row[3] as number,
  };
}

export function createPlanList(
  title: string,
  display_order: number,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO plan_lists (title, display_order) VALUES (?, ?)",
  ).run(title, display_order);
  return result.lastInsertRowid as number;
}

export function updatePlanListOrder(
  id: number,
  new_order: number,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE plan_lists SET display_order = ? WHERE id = ?",
  ).run(new_order, id);
  return result.changes > 0;
}

export function deletePlanList(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM plan_lists WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getPlanItems(
  listId: number,
  db?: Database.Database,
): PlanItem[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, list_id, name, description, amount, created_at FROM plan_items WHERE list_id = ? ORDER BY id",
  ).raw(true).all(listId) as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    list_id: row[1] as number,
    name: row[2] as string,
    description: row[3] as string | null,
    amount: row[4] as number,
    created_at: row[5] as number,
  }));
}

export function getPlanItemById(
  id: number,
  db?: Database.Database,
): PlanItem | undefined {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, list_id, name, description, amount, created_at FROM plan_items WHERE id = ?",
  ).raw(true).all(id) as unknown[][];
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row[0] as number,
    list_id: row[1] as number,
    name: row[2] as string,
    description: row[3] as string | null,
    amount: row[4] as number,
    created_at: row[5] as number,
  };
}

export function createPlanItem(
  listId: number,
  name: string,
  description: string | null,
  amount: number,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO plan_items (list_id, name, description, amount) VALUES (?, ?, ?, ?)",
  ).run(listId, name, description, amount);
  return result.lastInsertRowid as number;
}

export function updatePlanItem(
  id: number,
  name: string,
  description: string | null,
  amount: number,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE plan_items SET name = ?, description = ?, amount = ? WHERE id = ?",
  ).run(name, description, amount, id);
  return result.changes > 0;
}

export function deletePlanItem(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM plan_items WHERE id = ?").run(id);
  return result.changes > 0;
}

export function deleteAllPlanItems(
  listId: number,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "DELETE FROM plan_items WHERE list_id = ?",
  ).run(listId);
  return result.changes;
}