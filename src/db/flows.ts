import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface MoneyFlow {
  id: number;
  description: string;
  amount: number;
  day_of_month: number;
  created_at: number;
}

export function getMoneyFlows(db?: Database.Database): MoneyFlow[] {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, description, amount, day_of_month, created_at FROM money_flows ORDER BY (day_of_month < 15), day_of_month ASC, description ASC"
  ).all() as MoneyFlow[];
}

export function addMoneyFlow(
  description: string,
  amount: number,
  day_of_month: number,
  db?: Database.Database
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO money_flows (description, amount, day_of_month) VALUES (?, ?, ?)"
  ).run(description, amount, day_of_month);
  return Number(result.lastInsertRowid);
}

export function updateMoneyFlow(
  id: number,
  description: string,
  amount: number,
  day_of_month: number,
  db?: Database.Database
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "UPDATE money_flows SET description = ?, amount = ?, day_of_month = ? WHERE id = ?"
  ).run(description, amount, day_of_month, id);
  return result.changes > 0;
}

export function deleteMoneyFlow(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare("DELETE FROM money_flows WHERE id = ?").run(id);
  return result.changes > 0;
}

export function getMoneyFlow(id: number, db?: Database.Database): MoneyFlow | undefined {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, description, amount, day_of_month, created_at FROM money_flows WHERE id = ?"
  ).get(id) as MoneyFlow | undefined;
}
