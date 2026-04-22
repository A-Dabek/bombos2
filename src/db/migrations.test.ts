import { DB } from "sqlite";
import { runMigrations } from "./migrations.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("runMigrations applies new migrations", async () => {
  const db = new DB();
  await runMigrations(db);

  const rows = [...db.query("SELECT name FROM _migrations")];
  assertEquals(rows.length, 1);
  assertEquals(rows[0][0], "001_init.sql");

  db.close();
});

Deno.test("runMigrations skips already applied migrations", async () => {
  const db = new DB();
  await runMigrations(db);
  await runMigrations(db);

  const rows = [...db.query("SELECT name FROM _migrations")];
  assertEquals(rows.length, 1);

  db.close();
});

Deno.test("runMigrations applies custom migration files", async () => {
  const db = new DB();
  const tempFile = "src/db/migrations/002_test.sql";
  await Deno.writeTextFile(tempFile, "CREATE TABLE test_table (id INTEGER PRIMARY KEY);");

  try {
    await runMigrations(db);

    const rows = [...db.query("SELECT name FROM _migrations ORDER BY name")];
    assertEquals(rows.length, 2);
    assertEquals(rows[0][0], "001_init.sql");
    assertEquals(rows[1][0], "002_test.sql");

    const tableCheck = [...db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'")];
    assertEquals(tableCheck.length, 1);
  } finally {
    await Deno.remove(tempFile).catch(() => {});
    db.close();
  }
});

Deno.test("runMigrations does not record failed migrations", async () => {
  const db = new DB();
  const tempFile = "src/db/migrations/002_bad.sql";
  await Deno.writeTextFile(tempFile, "INVALID SQL SYNTAX;");

  try {
    let errorCaught = false;
    try {
      await runMigrations(db);
    } catch (_e) {
      errorCaught = true;
    }

    assertEquals(errorCaught, true);

    const rows = [...db.query("SELECT name FROM _migrations")];
    assertEquals(rows.length, 1);
    assertEquals(rows[0][0], "001_init.sql");
  } finally {
    await Deno.remove(tempFile).catch(() => {});
    db.close();
  }
});
