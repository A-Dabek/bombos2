import { test, expect } from "vitest";
import { shouldAddAutomaticPayments, isBillsUrgent, addPeriodStartTransaction, addBillTransaction } from "./bills.ts";
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
