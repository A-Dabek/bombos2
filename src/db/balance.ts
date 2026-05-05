import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface BalanceConfig {
  id: number;
  day_of_month: number;
}

export interface BalanceTransaction {
  id: number;
  description: string;
  amount: number;
  created_at: number;
}

export function getBalanceConfig(
  db?: Database.Database,
): BalanceConfig {
  const dbConn = db ?? getDb();
  const config = dbConn.prepare(
    "SELECT id, day_of_month FROM balance_config WHERE id = 1",
  ).get() as BalanceConfig | undefined;
  if (!config) {
    dbConn.prepare(
      "INSERT OR IGNORE INTO balance_config (id, day_of_month) VALUES (1, 15)",
    ).run();
    return getBalanceConfig(dbConn);
  }
  return config;
}

export function updateBalanceConfig(
  day_of_month: number,
  db?: Database.Database,
): BalanceConfig {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "UPDATE balance_config SET day_of_month = ? WHERE id = 1",
  ).run(day_of_month);
  return getBalanceConfig(dbConn);
}

export function addBalanceTransaction(
  description: string,
  amount: number,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO balance_transactions (description, amount) VALUES (?, ?)",
  ).run(description, amount);
  return Number(result.lastInsertRowid);
}

export function getBalanceTransactions(
  db?: Database.Database,
): BalanceTransaction[] {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, description, amount, created_at FROM balance_transactions ORDER BY id DESC",
  ).all() as BalanceTransaction[];
}