import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { getOrdinal } from "~/utils/date";

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

export interface BalanceTransactionGroup {
  periodLabel: string;        // "May 15th – June 15th"
  periodStartTs: number;       // for sorting
  transactions: BalanceTransaction[];  // excludes is_automatic=1
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

function getBalanceTargetDate(dayOfMonth: number): Date {
  const today = new Date();
  if (today.getDate() >= dayOfMonth) {
    return new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  } else {
    return new Date(today.getFullYear(), today.getMonth() - 1, dayOfMonth);
  }
}

export function shouldAddBalancePeriodStart(db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const config = getBalanceConfig(dbConn);
  const today = new Date().getDate();
  return today === config.day_of_month;
}

export function runBalancePeriodStart(db?: Database.Database): PeriodStartResult {
  const dbConn = db ?? getDb();
  const config = getBalanceConfig(dbConn);
  
  // Calculate target date
  const target = getBalanceTargetDate(config.day_of_month);
  const targetTs = Math.floor(target.getTime() / 1000);
  
  // Check if period-start already exists for target's period
  const year = target.getFullYear();
  const month = target.getMonth();
  const periodStartTs = Math.floor(new Date(year, month, config.day_of_month).getTime() / 1000);
  const nextPeriodStartTs = Math.floor(new Date(year, month + 1, config.day_of_month).getTime() / 1000);
  
  const existing = dbConn.prepare(
    "SELECT id FROM balance_transactions WHERE is_automatic = 1 AND created_at >= ? AND created_at < ?"
  ).get(periodStartTs, nextPeriodStartTs);
  
  if (existing) {
    return { added: false };
  }
  
  // Add period-start marker with target date
  dbConn.prepare(
    "INSERT INTO balance_transactions (description, amount, is_automatic, created_at) VALUES ('Period start', 0, 1, ?)"
  ).run(targetTs);
  
  return { added: true };
}

export function getBalanceTransactionsGroupedByPeriod(
  db?: Database.Database,
): BalanceTransactionGroup[] {
  const dbConn = db ?? getDb();

  // Get ALL transactions ASC (oldest first) for proper grouping
  const transactions = dbConn.prepare(
    "SELECT id, description, amount, is_automatic, created_at FROM balance_transactions ORDER BY id ASC",
  ).all() as BalanceTransaction[];

  const groups: BalanceTransactionGroup[] = [];
  let currentGroup: BalanceTransactionGroup | null = null;

  for (const tx of transactions) {
    // Period-start marker: new group begins
    if (tx.is_automatic && tx.amount === 0) {
      const startDate = new Date(tx.created_at * 1000);
      const startDay = startDate.getDate();
      const startOrdinal = getOrdinal(startDay);
      const startMonth = startDate.toLocaleString("en-US", { month: "long" });

      // End date = same day next month
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDay = endDate.getDate();
      const endOrdinal = getOrdinal(endDay);
      const endMonth = endDate.toLocaleString("en-US", { month: "long" });

      const periodLabel = `${startMonth} ${startDay}${startOrdinal} – ${endMonth} ${endDay}${endOrdinal}`;

      currentGroup = {
        periodLabel,
        periodStartTs: tx.created_at,
        transactions: [],  // period markers are NOT included in the list
      };
      groups.push(currentGroup);
    } else if (currentGroup && !tx.is_automatic) {
      // Add to current group (only non-automatic transactions)
      currentGroup.transactions.push(tx);
    } else if (!currentGroup && !tx.is_automatic) {
      // No period marker yet: create a default group
      currentGroup = {
        periodLabel: "Transactions",
        periodStartTs: 0,
        transactions: [],
      };
      groups.push(currentGroup);
      currentGroup.transactions.push(tx);
    }
    // If no group and tx is_automatic (but not amount=0), skip it
  }

  // Reverse groups so newest period appears first (for UI)
  groups.reverse();
  // Reverse transactions within each group so newest appears first
  for (const group of groups) {
    group.transactions.reverse();
  }

  return groups;
}