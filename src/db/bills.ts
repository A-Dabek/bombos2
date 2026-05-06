import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { getOrdinal } from "~/utils/date";

export interface BillsConfig {
  id: number;
  day_of_month: number;
}

export interface BillsTransaction {
  id: number;
  description: string;
  amount: number;
  is_automatic: boolean;
  predefined_slug?: string;
  created_at: number;
}

export interface BillsTransactionGroup {
  periodLabel: string;        // "May 15th – June 15th"
  periodStartTs: number;       // for sorting
  transactions: BillsTransaction[];  // excludes is_automatic=1
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
  predefined_slug?: string,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  if (predefined_slug) {
    const result = dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug) VALUES (?, ?, ?, ?)"
    ).run(description, amount, is_automatic ? 1 : 0, predefined_slug);
    return Number(result.lastInsertRowid);
  } else {
    const result = dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic) VALUES (?, ?, ?)"
    ).run(description, amount, is_automatic ? 1 : 0);
    return Number(result.lastInsertRowid);
  }
}

export function getBillTransactions(
  db?: Database.Database,
  include_automatic = false,
): BillsTransaction[] {
  const dbConn = db ?? getDb();
  if (include_automatic) {
    return dbConn.prepare(
      "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions ORDER BY id DESC",
    ).all() as BillsTransaction[];
  }
  return dbConn.prepare(
    "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions WHERE is_automatic = 0 ORDER BY id DESC",
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

export function getBillTransactionsGroupedByPeriod(
  db?: Database.Database,
): BillsTransactionGroup[] {
  const dbConn = db ?? getDb();

  // Get ALL transactions ASC (oldest first) for proper grouping
  const transactions = dbConn.prepare(
    "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions ORDER BY id ASC",
  ).all() as BillsTransaction[];

  const groups: BillsTransactionGroup[] = [];
  let currentGroup: BillsTransactionGroup | null = null;

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

// ADR-023: Automatic Payments

export interface BillsAutomaticPayment {
  id: number;
  name: string;
  slug: string;
  amount: number;  // Absolute value (positive), stored as defined by user
  created_at: number;
}

export interface BillsAutomaticPaymentInput {
  name: string;
  slug: string;
  amount: number;  // Absolute value (positive)
}

export function getBillsAutomaticPayments(
  db?: Database.Database,
): BillsAutomaticPayment[] {
  const dbConn = db ?? getDb();
  // Order by amount DESC (highest to lowest) for admin UI and scheduler
  return dbConn.prepare(
    "SELECT id, name, slug, amount, created_at FROM bills_automatic_payments ORDER BY amount DESC"
  ).all() as BillsAutomaticPayment[];
}

export function addBillsAutomaticPayment(
  input: BillsAutomaticPaymentInput,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  // Validate slug format (single word, alphanumeric + underscores)
  if (!/^[a-zA-Z0-9_]+$/.test(input.slug)) {
    throw new Error("Slug must be a single word (alphanumeric + underscores only)");
  }
  
  // Validate amount is positive (absolute value)
  if (input.amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
  
  const result = dbConn.prepare(
    "INSERT INTO bills_automatic_payments (name, slug, amount) VALUES (?, ?, ?)"
  ).run(input.name, input.slug, input.amount);
  
  return Number(result.lastInsertRowid);
}

export function deleteBillsAutomaticPayment(
  id: number,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "DELETE FROM bills_automatic_payments WHERE id = ?"
  ).run(id);
}

export function createAutomaticPaymentTransactions(
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  // Get all active automatic payments ordered by amount DESC (highest to lowest)
  const payments = dbConn.prepare(
    "SELECT name, slug, amount FROM bills_automatic_payments ORDER BY amount DESC"
  ).all() as BillsAutomaticPayment[];
  
  let createdCount = 0;
  
  for (const payment of payments) {
    // Create transaction with is_automatic=1
    // Description stores the "name" for UI display
    // Amount is NEGATED because automatic payments are expenses
    // predefined_slug links back to the predefined payment
    dbConn.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug) VALUES (?, ?, 1, ?)"
    ).run(payment.name, -payment.amount, payment.slug);
    createdCount++;
  }
  
  return createdCount;
}

// ADR-024: Predefined Payments CRUD

export interface BillsPredefinedPayment {
  id: number;
  name: string;
  slug: string;
  created_at: number;
}

export function getBillsPredefinedPayments(
  db?: Database.Database,
): BillsPredefinedPayment[] {
  const dbConn = db ?? getDb();
  return dbConn.prepare(
    "SELECT id, name, slug, created_at FROM bills_predefined_payments ORDER BY name ASC"
  ).all() as BillsPredefinedPayment[];
}

export function addBillsPredefinedPayment(
  input: { name: string; slug: string },
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  
  if (!/^[a-zA-Z0-9_]+$/.test(input.slug)) {
    throw new Error("Slug must be a single word (alphanumeric + underscores only)");
  }
  
  const result = dbConn.prepare(
    "INSERT INTO bills_predefined_payments (name, slug) VALUES (?, ?)"
  ).run(input.name, input.slug);
  
  return Number(result.lastInsertRowid);
}

export function deleteBillsPredefinedPayment(
  id: number,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "DELETE FROM bills_predefined_payments WHERE id = ?"
  ).run(id);
}