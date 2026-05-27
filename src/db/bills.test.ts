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

  // Insert an automatic payment transaction (is_automatic=1, predefined_slug set)
  db.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug, created_at) VALUES (?, ?, 1, ?, ?)"
  ).run("Rent", -1000, "rent", Math.floor(Date.now() / 1000));

  const result = shouldAddAutomaticPayments(db);
  expect(result).toBe(false);

  db.close();
});

test("shouldAddAutomaticPayments returns true when only manual predefined transactions exist in period", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  // Insert a manually-added predefined payment transaction (is_automatic=0, predefined_slug set)
  // This should NOT suppress automatic payments — only is_automatic=1 transactions count
  db.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug, created_at) VALUES (?, ?, 0, ?, ?)"
  ).run("Electricity", -200, "electricity", Math.floor(Date.now() / 1000));

  const result = shouldAddAutomaticPayments(db);
  expect(result).toBe(true);

  db.close();
});
