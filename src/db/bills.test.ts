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

  // Insert an automatic payment transaction in current period
  db.prepare(
    "INSERT INTO bills_transactions (description, amount, is_automatic, predefined_slug, created_at) VALUES (?, ?, 1, ?, ?)"
  ).run("Rent", -1000, "rent", Math.floor(Date.now() / 1000));

  const result = shouldAddAutomaticPayments(db);
  expect(result).toBe(false);

  db.close();
});
