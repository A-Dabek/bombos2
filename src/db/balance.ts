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
  is_automatic: boolean;
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
  is_automatic = false,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO balance_transactions (description, amount, is_automatic) VALUES (?, ?, ?)",
  ).run(description, amount, is_automatic ? 1 : 0);
  return Number(result.lastInsertRowid);
}

export function getBalanceTransactions(
  db?: Database.Database,
  include_automatic = false,
): BalanceTransaction[] {
  const dbConn = db ?? getDb();
  if (include_automatic) {
    return dbConn.prepare(
      "SELECT id, description, amount, is_automatic, created_at FROM balance_transactions ORDER BY id DESC",
    ).all() as BalanceTransaction[];
  }
  return dbConn.prepare(
    "SELECT id, description, amount, is_automatic, created_at FROM balance_transactions WHERE is_automatic = 0 ORDER BY id DESC",
  ).all() as BalanceTransaction[];
}

export function addPeriodStartTransaction(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO balance_transactions (description, amount, is_automatic) VALUES ('Period start', 0, 1)",
  ).run();
  return Number(result.lastInsertRowid);
}

export interface PeriodStartResult {
  added: boolean;
}

export function checkAndAddBalancePeriodStart(
  db?: Database.Database,
): PeriodStartResult {
  const dbConn = db ?? getDb();
  const config = getBalanceConfig(dbConn);
  const today = new Date();
  const day_of_month = config.day_of_month;

  if (today.getDate() !== day_of_month) {
    return { added: false };
  }

  // Calculate period boundaries
  const year = today.getFullYear();
  const month = today.getMonth();
  const periodStartTs = Math.floor(
    new Date(year, month, day_of_month).getTime() / 1000,
  );
  const nextPeriodStartTs = Math.floor(
    new Date(year, month + 1, day_of_month).getTime() / 1000,
  );

  // Check if period-start marker already exists
  const existing = dbConn.prepare(
    "SELECT id FROM balance_transactions WHERE is_automatic = 1 AND created_at >= ? AND created_at < ?",
  ).get(periodStartTs, nextPeriodStartTs);

  if (existing) {
    return { added: false };
  }

  addPeriodStartTransaction(dbConn);
  return { added: true };
}