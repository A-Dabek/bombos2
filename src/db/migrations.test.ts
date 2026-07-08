import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";
import { test, expect } from "vitest";
import { writeFile, rm } from "node:fs/promises";

test("runMigrations applies new migrations", () => {
  const db = new Database(":memory:");
  runMigrations(db);

  const rows = db.prepare("SELECT name FROM _migrations").raw(true).all() as string[][];
  expect(rows.length).toBe(29);
  expect(rows[0][0]).toBe("001_init.sql");
  expect(rows[1][0]).toBe("002_parcels.sql");
  expect(rows[2][0]).toBe("003_parcels_completed_at.sql");
  expect(rows[3][0]).toBe("004_parcels_note.sql");
  expect(rows[4][0]).toBe("005_meals.sql");
  expect(rows[5][0]).toBe("006_meals_seed.sql");
  expect(rows[6][0]).toBe("007_remove_breakfast.sql");
  expect(rows[7][0]).toBe("008_plan.sql");
  expect(rows[8][0]).toBe("009_plan_seed.sql");
  expect(rows[9][0]).toBe("010_allowance.sql");
  expect(rows[10][0]).toBe("011_add_is_automatic.sql");
  expect(rows[11][0]).toBe("012_drop_allowance_config_updated_at.sql");
  expect(rows[12][0]).toBe("013_bills.sql");
  expect(rows[13][0]).toBe("014_balance.sql");
  expect(rows[14][0]).toBe("015_add_is_automatic_bills.sql");
  expect(rows[15][0]).toBe("016_add_is_automatic_balance.sql");
  expect(rows[16][0]).toBe("017_add_urgent_remove_amount.sql");
  expect(rows[17][0]).toBe("018_add_bills_automatic_payments.sql");
  expect(rows[18][0]).toBe("019_add_predefined_payments.sql");
  expect(rows[19][0]).toBe("020_add_predefined_slug_to_transactions.sql");
  expect(rows[20][0]).toBe("021_groceries.sql");
  expect(rows[21][0]).toBe("021_import_historical_balance_transactions.sql");
  expect(rows[22][0]).toBe("022_import_historical_bills_transactions.sql");
  expect(rows[23][0]).toBe("023_add_groceries_amount_unit.sql");
  expect(rows[24][0]).toBe("024_groceries_categories.sql");
  expect(rows[25][0]).toBe("025_groceries_completed_categories.sql");
  expect(rows[26][0]).toBe("026_negate_positive_amounts.sql");
  expect(rows[27][0]).toBe("027_money_flows.sql");
  expect(rows[28][0]).toBe("028_settings.sql");

  db.close();
});

test("runMigrations skips already applied migrations", () => {
  const db = new Database(":memory:");
  runMigrations(db);
  runMigrations(db);

  const rows = db.prepare("SELECT name FROM _migrations").raw(true).all() as string[][];
  expect(rows.length).toBe(29);

  db.close();
});

test("runMigrations applies custom migration files", async () => {
  const db = new Database(":memory:");
  const tempFile = "src/db/migrations/003_test.sql";
  await writeFile(tempFile, "CREATE TABLE test_table (id INTEGER PRIMARY KEY);");

  try {
    runMigrations(db);

    const rows = db.prepare("SELECT name FROM _migrations ORDER BY name").raw(true).all() as string[][];
    expect(rows.length).toBe(30);
    expect(rows[0][0]).toBe("001_init.sql");
    expect(rows[1][0]).toBe("002_parcels.sql");
    expect(rows[2][0]).toBe("003_parcels_completed_at.sql");
    expect(rows[3][0]).toBe("003_test.sql");
    expect(rows[4][0]).toBe("004_parcels_note.sql");
    expect(rows[5][0]).toBe("005_meals.sql");
    expect(rows[6][0]).toBe("006_meals_seed.sql");
    expect(rows[7][0]).toBe("007_remove_breakfast.sql");
    expect(rows[8][0]).toBe("008_plan.sql");
    expect(rows[9][0]).toBe("009_plan_seed.sql");
    expect(rows[10][0]).toBe("010_allowance.sql");
    expect(rows[11][0]).toBe("011_add_is_automatic.sql");
    expect(rows[12][0]).toBe("012_drop_allowance_config_updated_at.sql");
    expect(rows[13][0]).toBe("013_bills.sql");
    expect(rows[14][0]).toBe("014_balance.sql");
    expect(rows[15][0]).toBe("015_add_is_automatic_bills.sql");
    expect(rows[16][0]).toBe("016_add_is_automatic_balance.sql");
    expect(rows[17][0]).toBe("017_add_urgent_remove_amount.sql");
    expect(rows[18][0]).toBe("018_add_bills_automatic_payments.sql");
    expect(rows[19][0]).toBe("019_add_predefined_payments.sql");
    expect(rows[20][0]).toBe("020_add_predefined_slug_to_transactions.sql");
    expect(rows[21][0]).toBe("021_groceries.sql");
    expect(rows[22][0]).toBe("021_import_historical_balance_transactions.sql");
    expect(rows[23][0]).toBe("022_import_historical_bills_transactions.sql");
    expect(rows[24][0]).toBe("023_add_groceries_amount_unit.sql");
    expect(rows[25][0]).toBe("024_groceries_categories.sql");
    expect(rows[26][0]).toBe("025_groceries_completed_categories.sql");
    expect(rows[27][0]).toBe("026_negate_positive_amounts.sql");
    expect(rows[28][0]).toBe("027_money_flows.sql");
    expect(rows[29][0]).toBe("028_settings.sql");

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
    expect(rows.length).toBe(29);
    expect(rows[0][0]).toBe("001_init.sql");
    expect(rows[1][0]).toBe("002_parcels.sql");
    expect(rows[2][0]).toBe("003_parcels_completed_at.sql");
    expect(rows[3][0]).toBe("004_parcels_note.sql");
    expect(rows[4][0]).toBe("005_meals.sql");
    expect(rows[5][0]).toBe("006_meals_seed.sql");
    expect(rows[6][0]).toBe("007_remove_breakfast.sql");
    expect(rows[7][0]).toBe("008_plan.sql");
    expect(rows[8][0]).toBe("009_plan_seed.sql");
    expect(rows[9][0]).toBe("010_allowance.sql");
    expect(rows[10][0]).toBe("011_add_is_automatic.sql");
    expect(rows[11][0]).toBe("012_drop_allowance_config_updated_at.sql");
    expect(rows[12][0]).toBe("013_bills.sql");
    expect(rows[13][0]).toBe("014_balance.sql");
    expect(rows[14][0]).toBe("015_add_is_automatic_bills.sql");
    expect(rows[15][0]).toBe("016_add_is_automatic_balance.sql");
    expect(rows[16][0]).toBe("017_add_urgent_remove_amount.sql");
    expect(rows[17][0]).toBe("018_add_bills_automatic_payments.sql");
    expect(rows[18][0]).toBe("019_add_predefined_payments.sql");
    expect(rows[19][0]).toBe("020_add_predefined_slug_to_transactions.sql");
    expect(rows[20][0]).toBe("021_groceries.sql");
    expect(rows[21][0]).toBe("021_import_historical_balance_transactions.sql");
    expect(rows[22][0]).toBe("022_import_historical_bills_transactions.sql");
    expect(rows[23][0]).toBe("023_add_groceries_amount_unit.sql");
    expect(rows[24][0]).toBe("024_groceries_categories.sql");
    expect(rows[25][0]).toBe("025_groceries_completed_categories.sql");
    expect(rows[26][0]).toBe("026_negate_positive_amounts.sql");
    expect(rows[27][0]).toBe("027_money_flows.sql");
    expect(rows[28][0]).toBe("028_settings.sql");
  } finally {
    await rm(tempFile).catch(() => {});
    db.close();
  }
});