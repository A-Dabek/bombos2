import { test, expect, vi } from "vitest";
import {
  getAllowanceConfig,
  getCurrentBalance,
  addAllowanceTransaction,
  getTransactionsGroupedByPeriod,
  deleteLastTransaction,
  updateAllowanceConfig,
  shouldAddAllowance,
  runAllowance,
  getLastTransactionId,
} from "./allowance.ts";
import { openDb, resetDb } from "./connection.ts";

test("getAllowanceConfig creates default or returns existing", () => {
  resetDb();
  const db = openDb(":memory:");
  // First call creates default
  let config = getAllowanceConfig(db);
  expect(config.day_of_month).toBe(15);
  expect(config.monthly_amount).toBe(600);

  // Update and verify
  updateAllowanceConfig(10, 1000, db);
  config = getAllowanceConfig(db);
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

  const groups = getTransactionsGroupedByPeriod(db);
  const transactions = groups.flatMap((g) => g.transactions);
  const expense = transactions.find((t) => t.type === "expense");
  expect(expense?.balance_after).toBe(450);
  db.close();
  resetDb();
});

test("addAllowanceTransaction handles income correctly", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "Monthly", 600, db);
  addAllowanceTransaction("income", "Bonus", 100, db);

  const groups = getTransactionsGroupedByPeriod(db);
  const transactions = groups.flatMap((g) => g.transactions);
  const income = transactions.find((t) => t.type === "income");
  expect(income?.balance_after).toBe(700);
  db.close();
  resetDb();
});

test("getTransactionsGroupedByPeriod groups by allowance", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "January allowance", 600, db);
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
  addAllowanceTransaction("allowance", "January allowance", 600, db, true);
  addAllowanceTransaction("expense", "Lunch", 20, db);
  addAllowanceTransaction("allowance", "February allowance", 600, db, true);
  addAllowanceTransaction("expense", "Groceries", 100, db);

  const groups = getTransactionsGroupedByPeriod(db);
  expect(groups.length).toBe(2);
  expect(groups[0].transactions.length).toBe(2); // Feb group
  expect(groups[1].transactions.length).toBe(2); // Jan group
  db.close();
  resetDb();
});

test("deleteLastTransaction removes last transaction and returns correct balance", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "Monthly", 600, db);
  addAllowanceTransaction("expense", "Lunch", 20, db);
  addAllowanceTransaction("expense", "Dinner", 30, db);

  const result = deleteLastTransaction(db);
  expect(result.success).toBe(true);
  expect(result.newBalance).toBe(580); // 600 - 20

  // Verify only 2 transactions remain
  const groups = getTransactionsGroupedByPeriod(db);
  const allTx = groups.flatMap((g) => g.transactions);
  expect(allTx.length).toBe(2);
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

test("getLastTransactionId returns correct id", () => {
  resetDb();
  const db = openDb(":memory:");
  addAllowanceTransaction("allowance", "First", 100, db);
  addAllowanceTransaction("expense", "Second", 30, db);
  addAllowanceTransaction("income", "Third", 50, db);

  const lastId = getLastTransactionId(db);
  expect(lastId).toBe(3);

  deleteLastTransaction(db);
  const newLastId = getLastTransactionId(db);
  expect(newLastId).toBe(2);

  db.close();
  resetDb();
});

test("updateAllowanceConfig updates values", () => {
  resetDb();
  const db = openDb(":memory:");
  getAllowanceConfig(db);

  const updated = updateAllowanceConfig(25, 1200, db);
  expect(updated.day_of_month).toBe(25);
  expect(updated.monthly_amount).toBe(1200);

  const retrieved = getAllowanceConfig(db);
  expect(retrieved.day_of_month).toBe(25);
  expect(retrieved.monthly_amount).toBe(1200);
  db.close();
  resetDb();
});

test("checkAndAddAllowance does not add if not allowance day", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 0, 10)); // Jan 10, not the 15th

  resetDb();
  const db = openDb(":memory:");
  const result = shouldAddAllowance(db);
  expect(result).toBe(false);
  db.close();
  resetDb();

  vi.useRealTimers();
});

test("checkAndAddAllowance adds allowance on correct day", () => {
  resetDb();
  const db = openDb(":memory:");
  const today = new Date().getDate();
  updateAllowanceConfig(today, 500, db);

  const should = shouldAddAllowance(db);
  expect(should).toBe(true);
  
  const result = runAllowance(db);
  expect(result.added).toBe(true);
  expect(result.newBalance).toBe(500);

  const groups = getTransactionsGroupedByPeriod(db);
  const allTx = groups.flatMap((g) => g.transactions);
  expect(allTx.length).toBe(1);
  expect(allTx[0].type).toBe("allowance");
  db.close();
  resetDb();
});

test("checkAndAddAllowance does not duplicate in same month", () => {
  resetDb();
  const db = openDb(":memory:");
  const today = new Date().getDate();
  updateAllowanceConfig(today, 500, db);

  const result1 = runAllowance(db);
  expect(result1.added).toBe(true);

  const result2 = runAllowance(db);
  expect(result2.added).toBe(false);

  const groups = getTransactionsGroupedByPeriod(db);
  const allTx = groups.flatMap((g) => g.transactions);
  expect(allTx.length).toBe(1);
  db.close();
  resetDb();
});
