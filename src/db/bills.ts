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
  is_automatic: boolean;
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
  is_automatic = false,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic) VALUES (?, ?, ?)",
  ).run(description, amount, is_automatic ? 1 : 0);
  return Number(result.lastInsertRowid);
}

export function getBillTransactions(
  db?: Database.Database,
  include_automatic = false,
): BillsTransaction[] {
  const dbConn = db ?? getDb();
  if (include_automatic) {
    return dbConn.prepare(
      "SELECT id, description, amount, is_automatic, created_at FROM bills_transactions ORDER BY id DESC",
    ).all() as BillsTransaction[];
  }
  return dbConn.prepare(
    "SELECT id, description, amount, is_automatic, created_at FROM bills_transactions WHERE is_automatic = 0 ORDER BY id DESC",
  ).all() as BillsTransaction[];
}

export function addPeriodStartTransaction(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic) VALUES ('Period start', 0, 1)",
  ).run();
  return Number(result.lastInsertRowid);
}

export interface PeriodStartResult {
  added: boolean;
}

export function checkAndAddBillsPeriodStart(
  db?: Database.Database,
): PeriodStartResult {
  const dbConn = db ?? getDb();
  const config = getBillsConfig(dbConn);
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
    "SELECT id FROM bills_transactions WHERE is_automatic = 1 AND created_at >= ? AND created_at < ?",
  ).get(periodStartTs, nextPeriodStartTs);

  if (existing) {
    return { added: false };
  }

  addPeriodStartTransaction(dbConn);
  return { added: true };
}