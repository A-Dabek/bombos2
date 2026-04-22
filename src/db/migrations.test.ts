import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";
import { test, expect } from "vitest";
import { writeFile, rm } from "node:fs/promises";

test("runMigrations applies new migrations", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const rows = db.prepare("SELECT name FROM _migrations").raw(true).all() as string[][];
  expect(rows.length).toBe(2);
  expect(rows[0][0]).toBe("001_init.sql");
  expect(rows[1][0]).toBe("002_parcels.sql");

  db.close();
});

test("runMigrations skips already applied migrations", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  runMigrations(db);

  const rows = db.prepare("SELECT name FROM _migrations").raw(true).all() as string[][];
  expect(rows.length).toBe(2);

  db.close();
});

test("runMigrations applies custom migration files", async () => {
  const db = new Database(":memory:");
  const tempFile = "src/db/migrations/003_test.sql";
  await writeFile(tempFile, "CREATE TABLE test_table (id INTEGER PRIMARY KEY);");

  try {
    runMigrations(db);

    const rows = db.prepare("SELECT name FROM _migrations ORDER BY name").raw(true).all() as string[][];
    expect(rows.length).toBe(3);
    expect(rows[0][0]).toBe("001_init.sql");
    expect(rows[1][0]).toBe("002_parcels.sql");
    expect(rows[2][0]).toBe("003_test.sql");

    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'").raw(true).all() as unknown[][];
    expect(tableCheck.length).toBe(1);
  } finally {
    await rm(tempFile).catch(() => {});
    db.close();
  }
});

test("runMigrations does not record failed migrations", async () => {
  const db = new Database(":memory:");
  const tempFile = "src/db/migrations/999_bad.sql";
  await writeFile(tempFile, "INVALID SQL SYNTAX;");

  try {
    let errorCaught = false;
    try {
      runMigrations(db);
    } catch (_e) {
      errorCaught = true;
    }

    expect(errorCaught).toBe(true);

    const rows = db.prepare("SELECT name FROM _migrations").raw(true).all() as string[][];
    expect(rows.length).toBe(2);
    expect(rows[0][0]).toBe("001_init.sql");
    expect(rows[1][0]).toBe("002_parcels.sql");
  } finally {
    await rm(tempFile).catch(() => {});
    db.close();
  }
});
