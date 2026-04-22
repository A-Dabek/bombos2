import { test, expect } from "vitest";
import { getDb, openDb, resetDb } from "./connection.ts";

test("openDb returns a DB instance", () => {
  const db = openDb(":memory:");
  expect(db).toBeDefined();
  db.close();
});

test("openDb auto-runs migrations", () => {
  const db = openDb(":memory:");
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'").raw(true).all() as unknown[][];
  expect(rows.length).toBe(1);
  db.close();
});

test("getDb returns singleton", () => {
  resetDb();
  const db1 = getDb();
  const db2 = getDb();
  expect(db1).toBe(db2);
  db1.close();
  resetDb();
});

test("getDb creates data/app.db", () => {
  resetDb();
  const db = getDb();
  expect(db).toBeDefined();
  db.close();
  resetDb();
});
