import { test, expect } from "vitest";
import {
  getAllowanceConfig,
  getCurrentBalance,
  addAllowanceTransaction,
  getAllowanceTransactions,
  getTransactionsGroupedByPeriod,
  deleteLastTransaction,
  updateAllowanceConfig,
  checkAndAddAllowance,
} from "./allowance.ts";
import { openDb, resetDb } from "./connection.ts";

test("getAllowanceConfig creates default config if not exists", () => {
  resetDb();
  const db = openDb(":memory:");
  const config = getAllowanceConfig(db);
  expect(config.day_of_month).toBe(15);
  expect(config.monthly_amount).toBe(600);
  db.close();
  resetDb();
});

test("getAllowanceConfig returns existing config", () => {
  resetDb();
  const db = openDb(":memory:");
  // First call creates default
  getAllowanceConfig(db);
  // Update it
  updateAllowanceConfig(10, 1000, db);
  const config = getAllowanceConfig(db);
  expect(config.day_of_month).toBe(10);
  expect(config.monthly_amount).toBe(1000);
  db.close();
  resetDb();
});

test("getCurrentBalance returns 0 on empty DB", () => {
  resetDb();
  const db = openDb(":memory:");
  const balance = getCurrentBalance(db);
  expect(balance).toBe(0);
  db.close();
  resetDb();
});

test("getCurrentBalance returns correct balance after transactions", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "Test allowance", 500, db);
  addAllowanceTransaction("expense", "Lunch", 20, db);
  const balance = getCurrentBalance(db);
  expect(balance).toBe(480);
  db.close();
  resetDb();
});

test("addAllowanceTransaction returns numeric id", () => {
  resetDb();
  const db = openDb(":memory:");
  const id = addAllowanceTransaction("allowance", "Monthly", 600, db);
  expect(typeof id).toBe("number");
  expect(id > 0).toBe(true);
  db.close();
  resetDb();
});

test("addAllowanceTransaction handles expense correctly", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "Monthly", 600, db);
  addAllowanceTransaction("expense", "Groceries", 150, db);

  const transactions = getAllowanceTransactions(db);
  expect(transactions.length).toBe(2);
  expect(transactions[0].type).toBe("expense");
  expect(transactions[0].balance_after).toBe(450);
  expect(transactions[1].type).toBe("allowance");
  expect(transactions[1].balance_after).toBe(600);
  db.close();
  resetDb();
});

test("addAllowanceTransaction handles income correctly", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "Monthly", 600, db);
  addAllowanceTransaction("income", "Bonus", 100, db);

  const transactions = getAllowanceTransactions(db);
  expect(transactions[0].balance_after).toBe(700);
  db.close();
  resetDb();
});

test("getAllowanceTransactions returns in DESC order", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "First", 100, db);
  addAllowanceTransaction("expense", "Second", 30, db);
  addAllowanceTransaction("income", "Third", 50, db);

  const transactions = getAllowanceTransactions(db);
  expect(transactions.length).toBe(3);
  // Most recent first
  expect(transactions[0].description).toBe("Third");
  expect(transactions[1].description).toBe("Second");
  expect(transactions[2].description).toBe("First");
  db.close();
  resetDb();
});

test("getTransactionsGroupedByPeriod groups by allowance", () => {
  resetDb();
  const db = openDb(":memory:");
  // Create allowance transaction (starts new group)
  addAllowanceTransaction("allowance", "January allowance", 600, db);
  // Add some expenses to same group
  addAllowanceTransaction("expense", "Lunch", 20, db);
  addAllowanceTransaction("expense", "Dinner", 30, db);

  const groups = getTransactionsGroupedByPeriod(db);
  expect(groups.length).toBe(1);
  expect(groups[0].transactions.length).toBe(3);
  expect(groups[0].totalInGroup).toBe(550); // 600 - 20 - 30
  db.close();
  resetDb();
});

test("getTransactionsGroupedByPeriod creates multiple groups", () => {
  resetDb();
  const db = openDb(":memory:");
  // First allowance period
  addAllowanceTransaction("allowance", "January allowance", 600, db);
  addAllowanceTransaction("expense", "Lunch", 20, db);
  // Second allowance period
  addAllowanceTransaction("allowance", "February allowance", 600, db);
  addAllowanceTransaction("expense", "Groceries", 100, db);

  const groups = getTransactionsGroupedByPeriod(db);
  expect(groups.length).toBe(2);
  expect(groups[0].transactions.length).toBe(2); // Feb group
  expect(groups[1].transactions.length).toBe(2); // Jan group
  db.close();
  resetDb();
});

test("deleteLastTransaction removes last transaction and recalculates", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "Monthly", 600, db);
  addAllowanceTransaction("expense", "Lunch", 20, db);
  addAllowanceTransaction("expense", "Dinner", 30, db);

  const result = deleteLastTransaction(db);
  expect(result.success).toBe(true);
  expect(result.newBalance).toBe(580); // 600 - 20

  const transactions = getAllowanceTransactions(db);
  expect(transactions.length).toBe(2);
  expect(transactions[0].description).toBe("Lunch");
  db.close();
  resetDb();
});

test("deleteLastTransaction returns false on empty DB", () => {
  resetDb();
  const db = openDb(":memory:");
  const result = deleteLastTransaction(db);
  expect(result.success).toBe(false);
  db.close();
  resetDb();
});

test("updateAllowanceConfig updates values", () => {
  resetDb();
  const db = openDb(":memory:");
  // Ensure config exists
  getAllowanceConfig(db);

  const updated = updateAllowanceConfig(25, 1200, db);
  expect(updated.day_of_month).toBe(25);
  expect(updated.monthly_amount).toBe(1200);

  // Verify persisted
  const retrieved = getAllowanceConfig(db);
  expect(retrieved.day_of_month).toBe(25);
  expect(retrieved.monthly_amount).toBe(1200);
  db.close();
  resetDb();
});

test("checkAndAddAllowance does not add if not allowance day", () => {
  resetDb();
  const db = openDb(":memory:");
  // Config defaults to day 15
  const result = checkAndAddAllowance(db);
  expect(result.added).toBe(false);
  db.close();
  resetDb();
});

test("checkAndAddAllowance adds allowance on correct day", () => {
  resetDb();
  const db = openDb(":memory:");
  // Set config to today
  const today = new Date().getDate();
  updateAllowanceConfig(today, 500, db);

  const result = checkAndAddAllowance(db);
  expect(result.added).toBe(true);
  expect(result.newBalance).toBe(500);

  // Verify transaction created
  const transactions = getAllowanceTransactions(db);
  expect(transactions.length).toBe(1);
  expect(transactions[0].type).toBe("allowance");
  db.close();
  resetDb();
});

test("checkAndAddAllowance does not duplicate in same month", () => {
  resetDb();
  const db = openDb(":memory:");
  const today = new Date().getDate();
  updateAllowanceConfig(today, 500, db);

  // First call adds allowance
  const result1 = checkAndAddAllowance(db);
  expect(result1.added).toBe(true);

  // Second call should not add
  const result2 = checkAndAddAllowance(db);
  expect(result2.added).toBe(false);

  const transactions = getAllowanceTransactions(db);
  expect(transactions.length).toBe(1);
  db.close();
  resetDb();
});
