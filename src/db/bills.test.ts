import { test, expect } from "vitest";
import {
  shouldAddAutomaticPayments,
  isBillsUrgent,
  addPeriodStartTransaction,
  addBillTransaction,
  getBillTransactionsGroupedByPeriod,
  getAutomaticPaymentsForPeriod,
  addBillsAutomaticPayment,
} from "./bills.ts";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";

test("shouldAddAutomaticPayments returns true when no automatic payments exist in period", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const result = shouldAddAutomaticPayments(db);
  expect(result).toBe(true);

  db.close();
});

test("shouldAddAutomaticPayments returns false when automatic payment already exists in period", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  // Seed an automatic payment definition
  db.prepare(
    "INSERT INTO bills_automatic_payments (name, slug, amount) VALUES (?, ?, ?)"
  ).run("Rent", "rent", 1000);

  // Insert a matching transaction (predefined_slug matches auto-payment slug)
  db.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug, created_at) VALUES (?, ?, 0, ?, ?)"
  ).run("Rent", -1000, "rent", Math.floor(Date.now() / 1000));

  const result = shouldAddAutomaticPayments(db);
  expect(result).toBe(false);

  db.close();
});

test("shouldAddAutomaticPayments returns true when only manual predefined transactions exist in period", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  // Insert a manual transaction with predefined_slug that is NOT in bills_automatic_payments
  // This should NOT suppress automatic payments
  db.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug, created_at) VALUES (?, ?, 0, ?, ?)"
  ).run("Electricity", -200, "electricity", Math.floor(Date.now() / 1000));

  const result = shouldAddAutomaticPayments(db);
  expect(result).toBe(true);

  db.close();
});

test("isBillsUrgent returns false when no period marker exists", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.prepare("DELETE FROM bills_transactions").run();

  expect(isBillsUrgent(db)).toBe(false);
  db.close();
});

test("isBillsUrgent returns true when period marker exists but no manual payments", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  addPeriodStartTransaction(db);
  expect(isBillsUrgent(db)).toBe(true);

  db.close();
});

test("isBillsUrgent returns true when only automatic payments exist", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  addPeriodStartTransaction(db);
  
  // Add an automatic payment definition
  db.prepare(
    "INSERT INTO bills_automatic_payments (name, slug, amount) VALUES (?, ?, ?)"
  ).run("Rent", "rent", 1000);

  // Add a transaction linked to that automatic payment
  addBillTransaction("Rent", 1000, false, "rent", db);

  expect(isBillsUrgent(db)).toBe(true);
  db.close();
});

test("isBillsUrgent returns false when a truly manual payment exists", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  addPeriodStartTransaction(db);
  
  // Add a manual transaction (no slug)
  addBillTransaction("Groceries", 50, false, undefined, db);

  expect(isBillsUrgent(db)).toBe(false);
  db.close();
});

test("isBillsUrgent returns false when a predefined (but not auto) manual payment exists", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  addPeriodStartTransaction(db);
  
  // Add a predefined payment definition
  db.prepare(
    "INSERT INTO bills_predefined_payments (name, slug) VALUES (?, ?)"
  ).run("Electricity", "elec");

  // Add a transaction linked to that predefined payment
  addBillTransaction("Electricity", 200, false, "elec", db);

  expect(isBillsUrgent(db)).toBe(false);
  db.close();
});

test("isBillsUrgent considers only the current period", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  // Old period with manual payment
  const oldMarkerId = addPeriodStartTransaction(db);
  const oldMarker = db.prepare("SELECT created_at FROM bills_transactions WHERE id = ?").get(oldMarkerId) as { created_at: number };
  db.prepare("UPDATE bills_transactions SET created_at = ? WHERE id = ?").run(oldMarker.created_at - 40 * 24 * 3600, oldMarkerId);
  const oldTs = oldMarker.created_at - 40 * 24 * 3600;
  
  db.prepare("INSERT INTO bills_transactions (description, amount, is_automatic, created_at) VALUES (?, ?, 0, ?)")
    .run("Old Manual", -100, oldTs + 3600);

  // New period starts
  addPeriodStartTransaction(db);
  
  // Urgent because no manual payment in NEW period
  expect(isBillsUrgent(db)).toBe(true);

  // Add manual payment to NEW period
  addBillTransaction("New Manual", 50, false, undefined, db);
  expect(isBillsUrgent(db)).toBe(false);

  db.close();
});

test("getBillTransactionsGroupedByPeriod folds automatic payments into summary and keeps manual rows", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.prepare("DELETE FROM bills_transactions").run();

  addBillsAutomaticPayment({ name: "Rent", slug: "rent", amount: 1200 }, db);
  addBillsAutomaticPayment({ name: "Internet", slug: "internet", amount: 80 }, db);

  addPeriodStartTransaction(db);
  addBillTransaction("Rent", 1200, false, "rent", db);
  addBillTransaction("Internet", 80, false, "internet", db);
  addBillTransaction("Groceries", 200, false, undefined, db);

  const groups = getBillTransactionsGroupedByPeriod(db);
  expect(groups).toHaveLength(1);
  expect(groups[0].automatic).toEqual({ count: 2, total: -1280 });
  expect(groups[0].transactions).toHaveLength(1);
  expect(groups[0].transactions[0].description).toBe("Groceries");

  db.close();
});

test("getBillTransactionsGroupedByPeriod never counts period markers in automatic summary", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.prepare("DELETE FROM bills_transactions").run();

  addPeriodStartTransaction(db);
  addBillsAutomaticPayment({ name: "Rent", slug: "rent", amount: 1000 }, db);
  addBillTransaction("Rent", 1000, false, "rent", db);

  const groups = getBillTransactionsGroupedByPeriod(db);
  expect(groups).toHaveLength(1);
  expect(groups[0].automatic).toEqual({ count: 1, total: -1000 });
  expect(groups[0].transactions).toHaveLength(0);

  db.close();
});

test("getBillTransactionsGroupedByPeriod returns automatic null when no auto payments exist", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  db.prepare("DELETE FROM bills_transactions").run();

  addPeriodStartTransaction(db);
  addBillTransaction("Manual", 50, false, undefined, db);
  addBillTransaction("Predefined", 200, false, "elec", db);

  const groups = getBillTransactionsGroupedByPeriod(db);
  expect(groups).toHaveLength(1);
  expect(groups[0].automatic).toBeNull();
  expect(groups[0].transactions).toHaveLength(2);

  db.close();
});

test("getAutomaticPaymentsForPeriod respects boundaries and ordering", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  addBillsAutomaticPayment({ name: "Rent", slug: "rent", amount: 1200 }, db);

  const startTs = Math.floor(Date.UTC(2026, 6, 1) / 1000);
  const endTs = Math.floor(Date.UTC(2026, 7, 1) / 1000);

  const insert = (description: string, slug: string, amount: number, created_at: number) => {
    db.prepare(
      "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug, created_at) VALUES (?, ?, 0, ?, ?)"
    ).run(description, -Math.abs(amount), slug, created_at);
  };

  insert("Rent A", "rent", 1200, startTs + 3600);
  insert("Rent B", "rent", 1200, startTs);
  insert("Rent C", "rent", 1200, startTs + 7200);
  insert("Rent End", "rent", 1200, endTs);
  insert("Manual", "not_auto", 50, startTs + 4800);

  const txs = getAutomaticPaymentsForPeriod(startTs, endTs, db);
  expect(txs).toHaveLength(3);
  expect(txs.map(t => t.description)).toEqual(["Rent C", "Rent A", "Rent B"]);

  db.close();
});
