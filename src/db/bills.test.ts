import { test, expect } from "vitest";
import { shouldAddAutomaticPayments } from "./bills.ts";
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
