import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { getDb, openDb, resetDb } from "./connection.ts";

Deno.test("openDb returns a DB instance", async () => {
  const db = await openDb(":memory:");
  assertExists(db);
  db.close();
});

Deno.test("openDb auto-runs migrations", async () => {
  const db = await openDb(":memory:");
  const rows = [...db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'")];
  assertEquals(rows.length, 1);
  db.close();
});

Deno.test("getDb returns singleton", async () => {
  resetDb();
  const db1 = await getDb();
  const db2 = await getDb();
  assertEquals(db1, db2);
  db1.close();
  resetDb();
});

Deno.test("getDb creates data/app.db", async () => {
  resetDb();
  const db = await getDb();
  assertExists(db);
  db.close();
  resetDb();
});
