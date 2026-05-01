import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface AllowanceConfig {
  id: number;
  day_of_month: number;
  monthly_amount: number;
  updated_at: number;
}

export interface AllowanceTransaction {
  id: number;
  type: "allowance" | "expense" | "income";
  description: string;
  amount: number;
  balance_after: number;
  created_at: number;
  is_automatic: boolean;
}

export function getAllowanceConfig(
  db?: Database.Database,
): AllowanceConfig {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, day_of_month, monthly_amount, updated_at FROM allowance_config WHERE id = 1",
  ).raw(true).all() as unknown[][];
  if (rows.length === 0) {
    dbConn.prepare(
      "INSERT OR IGNORE INTO allowance_config (id, day_of_month, monthly_amount) VALUES (1, 15, 600)",
    ).run();
    return getAllowanceConfig(dbConn);
  }
  const row = rows[0];
  return {
    id: row[0] as number,
    day_of_month: row[1] as number,
    monthly_amount: row[2] as number,
    updated_at: row[3] as number,
  };
}

export function getCurrentBalance(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT balance_after FROM allowance_transactions ORDER BY id DESC LIMIT 1",
  ).raw(true).all() as unknown[][];
  if (rows.length === 0) return 0;
  return rows[0][0] as number;
}

export interface TransactionGroup {
  periodLabel: string;
  transactions: AllowanceTransaction[];
  totalInGroup: number;
}

export function getTransactionsGroupedByPeriod(
  db?: Database.Database,
): TransactionGroup[] {
  const dbConn = db ?? getDb();
  // Get transactions in ASC order (oldest first) for proper grouping
  const rows = dbConn.prepare(
    "SELECT id, type, description, amount, balance_after, created_at, is_automatic FROM allowance_transactions ORDER BY id ASC",
  ).raw(true).all() as unknown[][];

  const transactions: AllowanceTransaction[] = rows.map((row) => ({
    id: row[0] as number,
    type: row[1] as "allowance" | "expense" | "income",
    description: row[2] as string,
    amount: row[3] as number,
    balance_after: row[4] as number,
    created_at: row[5] as number,
    is_automatic: Boolean(row[6]),
  }));

  const groups: TransactionGroup[] = [];
  let currentGroup: TransactionGroup | null = null;

  for (const tx of transactions) {
    // Each automatic allowance transaction starts a new group
    if (tx.is_automatic && tx.type === "allowance") {
      const date = new Date(tx.created_at * 1000);
      const monthName = date.toLocaleString("en-US", { month: "long" });
      const day = date.getDate();
      const ordinal = getOrdinal(day);
      const periodLabel = `${monthName} ${day}${ordinal}`;

      currentGroup = {
        periodLabel,
        transactions: [tx],
        totalInGroup: tx.amount,
      };
      groups.push(currentGroup);
    } else if (currentGroup) {
      // Add to current group
      currentGroup.transactions.push(tx);
      currentGroup.totalInGroup += tx.type === "expense" ? -tx.amount : tx.amount;
    } else {
      // No group yet, create a default one
      if (!currentGroup) {
        currentGroup = {
          periodLabel: "Transactions",
          transactions: [],
          totalInGroup: 0,
        };
        groups.push(currentGroup);
      }
      currentGroup.transactions.push(tx);
      currentGroup.totalInGroup += tx.type === "expense" ? -tx.amount : tx.amount;
    }
  }

  // Reverse groups so newest period appears first (for UI display)
  groups.reverse();
  // Also reverse transactions within each group so newest appears first
  for (const group of groups) {
    group.transactions.reverse();
  }

  return groups;
}

function getOrdinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export function getAllowanceTransactions(
  db?: Database.Database,
): AllowanceTransaction[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, type, description, amount, balance_after, created_at, is_automatic FROM allowance_transactions ORDER BY id DESC",
  ).raw(true).all() as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    type: row[1] as "allowance" | "expense" | "income",
    description: row[2] as string,
    amount: row[3] as number,
    balance_after: row[4] as number,
    created_at: row[5] as number,
    is_automatic: Boolean(row[6]),
  }));
}

export function addAllowanceTransaction(
  type: "allowance" | "expense" | "income",
  description: string,
  amount: number,
  db?: Database.Database,
  is_automatic: boolean = false,
  created_at?: number, // Unix timestamp in seconds
): number {
  const dbConn = db ?? getDb();
  const currentBalance = getCurrentBalance(dbConn);
  const newBalance = type === "expense" ? currentBalance - amount : currentBalance + amount;

  const timestamp = created_at ?? Math.floor(Date.now() / 1000);

  const result = dbConn.prepare(
    "INSERT INTO allowance_transactions (type, description, amount, balance_after, is_automatic, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(type, description, amount, newBalance, is_automatic ? 1 : 0, timestamp);

  return Number(result.lastInsertRowid);
}

export function deleteLastTransaction(
  db?: Database.Database,
): { success: boolean; newBalance: number } {
  const dbConn = db ?? getDb();

  const lastRow = dbConn.prepare(
    "SELECT id FROM allowance_transactions ORDER BY id DESC LIMIT 1",
  ).raw(true).get() as unknown[][];

  if (!lastRow) return { success: false, newBalance: 0 };

  const lastId = lastRow[0] as number;

  dbConn.prepare("DELETE FROM allowance_transactions WHERE id = ?").run(lastId);

  // Recalculate all balances
  const allTx = dbConn.prepare(
    "SELECT id, type, amount FROM allowance_transactions ORDER BY id ASC",
  ).raw(true).all() as unknown[][];

  let runningBalance = 0;
  for (const row of allTx) {
    const type = row[1] as string;
    const amount = row[2] as number;
    runningBalance += type === "expense" ? -amount : amount;
    dbConn.prepare(
      "UPDATE allowance_transactions SET balance_after = ? WHERE id = ?",
    ).run(runningBalance, row[0] as number);
  }

  return { success: true, newBalance: runningBalance };
}

export function checkAndAddAllowance(
  db?: Database.Database,
): { added: boolean; newBalance: number } {
  const dbConn = db ?? getDb();
  const config = getAllowanceConfig(dbConn);
  const now = new Date();
  const today = now.getDate();

  // Check if today is the allowance day
  if (today !== config.day_of_month) {
    return { added: false, newBalance: getCurrentBalance(dbConn) };
  }

  // Check if allowance already added for this month
  const year = now.getFullYear();
  const month = now.getMonth();
  const startOfMonth = Math.floor(new Date(year, month, 1).getTime() / 1000);
  const startOfNextMonth = Math.floor(new Date(year, month + 1, 1).getTime() / 1000);

  const existing = dbConn.prepare(
    "SELECT id FROM allowance_transactions WHERE type = 'allowance' AND created_at >= ? AND created_at < ?",
  ).raw(true).get(startOfMonth, startOfNextMonth) as unknown[][];

  if (existing && existing.length > 0) {
    return { added: false, newBalance: getCurrentBalance(dbConn) };
  }

  // Add allowance transaction (automatic)
  const description = `${now.toLocaleString("en-US", { month: "long" })} allowance`;
  addAllowanceTransaction("allowance", description, config.monthly_amount, dbConn, true);

  return { added: true, newBalance: getCurrentBalance(dbConn) };
}

export function updateAllowanceConfig(
  day_of_month: number,
  monthly_amount: number,
  db?: Database.Database,
): AllowanceConfig {
  const dbConn = db ?? getDb();

  dbConn.prepare(
    "UPDATE allowance_config SET day_of_month = ?, monthly_amount = ?, updated_at = ? WHERE id = 1",
  ).run(day_of_month, monthly_amount, Math.floor(Date.now() / 1000));

  return getAllowanceConfig(dbConn);
}
