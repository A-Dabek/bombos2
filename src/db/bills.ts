import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface BillsConfig {
  id: number;
  day_of_month: number;
}

export interface BillsTransaction {
  id: number;
  description: string;
  amount: number;
  created_at: number;
}

export function getBillsConfig(
  db?: Database.Database,
): BillsConfig {
  const dbConn = db ?? getDb();
  const config = dbConn.prepare(
    "SELECT id, day_of_month FROM bills_config WHERE id = 1",
  ).get() as BillsConfig | undefined;
  if (!config) {
    dbConn.prepare(
      "INSERT OR IGNORE INTO bills_config (id, day_of_month) VALUES (1, 15)",
    ).run();
    return getBillsConfig(dbConn);
  }
  return config;
}

export function updateBillsConfig(
  day_of_month: number,
  db?: Database.Database,
): BillsConfig {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "UPDATE bills_config SET day_of_month = ? WHERE id = 1",
  ).run(day_of_month);
  return getBillsConfig(dbConn);
}

export function addBillTransaction(
  description: string,
  amount: number,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO bills_transactions (description, amount) VALUES (?, ?)",
  ).run(description, amount);
  return Number(result.lastInsertRowid);
}

export function getBillTransactions(
  db?: Database.Database,
): BillsTransaction[] {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, description, amount, created_at FROM bills_transactions ORDER BY id DESC",
  ).all() as BillsTransaction[];
}