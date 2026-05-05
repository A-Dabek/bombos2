import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { getOrdinal } from "~/utils/date";

export interface AllowanceConfig {
  id: number;
  day_of_month: number;
  monthly_amount: number;
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
  const config = dbConn.prepare(
    "SELECT id, day_of_month, monthly_amount FROM allowance_config WHERE id = 1",
  ).get() as AllowanceConfig | undefined;
  if (!config) {
    dbConn.prepare(
      "INSERT OR IGNORE INTO allowance_config (id, day_of_month, monthly_amount) VALUES (1, 15, 600)",
    ).run();
    return getAllowanceConfig(dbConn);
  }
  return config;
}

export function getCurrentBalance(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const row = dbConn.prepare(
    "SELECT balance_after FROM allowance_transactions ORDER BY id DESC LIMIT 1",
  ).get() as { balance_after: number } | undefined;
  return row?.balance_after ?? 0;
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
  const transactions = dbConn.prepare(
    "SELECT id, type, description, amount, balance_after, created_at, is_automatic FROM allowance_transactions ORDER BY id ASC",
  ).all() as AllowanceTransaction[];

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

export function getLastTransactionId(
  db?: Database.Database,
): number | null {
  const dbConn = db ?? getDb();
  const row = dbConn.prepare(
    "SELECT id FROM allowance_transactions ORDER BY id DESC LIMIT 1",
  ).get() as { id: number } | undefined;
  return row?.id ?? null;
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
  ).get() as { id: number } | undefined;

  if (!lastRow) return { success: false, newBalance: 0 };

  dbConn.prepare("DELETE FROM allowance_transactions WHERE id = ?").run(lastRow.id);

  // Return balance from new last transaction (or 0 if empty)
  const newLast = dbConn.prepare(
    "SELECT balance_after FROM allowance_transactions ORDER BY id DESC LIMIT 1",
  ).get() as { balance_after: number } | undefined;

  return { success: true, newBalance: newLast?.balance_after ?? 0 };
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
  ).get(startOfMonth, startOfNextMonth) as { id: number } | undefined;

  if (existing) {
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
    "UPDATE allowance_config SET day_of_month = ?, monthly_amount = ? WHERE id = 1",
  ).run(day_of_month, monthly_amount);

  return getAllowanceConfig(dbConn);
}
