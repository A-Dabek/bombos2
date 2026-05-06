import Database from "better-sqlite3";
import { openDb } from "../src/db/connection.ts";

const DB_PATH = "./data/app.db";

// Ensure migrations run before any DB operations
const _db = openDb(DB_PATH);
_db.close();

export function clearParcels() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM parcels").run();
  db.close();
}

export function addParcelSql(type: "incoming" | "outgoing", completed_at?: number) {
  const db = new Database(DB_PATH);
  const dummyImage = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  db.prepare(
    "INSERT INTO parcels (type, image, content_type, created_at, completed_at) VALUES (?, ?, ?, ?, ?)",
  ).run(type, dummyImage, "image/png", Date.now(), completed_at ?? null);
  db.close();
}

export function clearPlan() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM plan_items").run();
  db.prepare("DELETE FROM plan_lists").run();
  db.close();
}

export function clearMeals() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM meals").run();
  db.exec(`
    INSERT INTO meals (category, name) VALUES
      ('dinner', 'Potrawka'), ('dinner', 'Kotlety z fasoli'), ('dinner', 'Rolady z kurczaka z pesto'),
      ('dinner', 'Pad thai'), ('dinner', 'Makaron z łososiem'), ('dinner', 'Makaron z pesto'),
      ('dinner', 'Kopytka'), ('dinner', 'Burgery'), ('dinner', 'Kurczak sojowy'), ('dinner', 'Pierogi'),
      ('dinner', 'Kurczak ze szparagami'), ('dinner', 'Pyzy z farszem'), ('dinner', 'Ryż z warzywami'),
      ('dinner', 'Jajko sadzone'), ('dinner', 'Makaron z krewetkami'), ('dinner', 'Carbonara'),
      ('dinner', 'Łosoś na parze'), ('dinner', 'Zapiekanka makaronowa'), ('dinner', 'Pita z kurczakiem'),
      ('dinner', 'Ramen'), ('dinner', 'Łosoś z łódeczkami'), ('dinner', 'Placki ziemniaczane'),
      ('dinner', 'Indyk w sosie sojowo-chilli'), ('dinner', 'Paluszki rybne'), ('dinner', 'Ryba z grilla'),
      ('dinner', 'Szare kluchy'), ('dinner', 'Kurczak curry w mleku kokosowym'), ('dinner', 'Kotlety'),
      ('dinner', 'Steki'), ('dinner', 'Chalupas'), ('dinner', 'Gnocchi z kurczakiem w sosie grzybowym'),
      ('dinner', 'Pierogi z piekarnika'), ('dinner', 'Naleśniki ze szpinakiem'),
      ('supper', 'Warzywa z humusem'), ('supper', 'Tortille'), ('supper', 'Zupa'),
      ('supper', 'Frytki zapiekane'), ('supper', 'Płatki z mlekiem'), ('supper', 'Ślimaki'),
      ('supper', 'Zapieksy'), ('supper', 'Kanapki z makrelą w pomidorach'), ('supper', 'Sałatka z kukurydzą'),
      ('supper', 'Sałatka z brokułem'), ('supper', 'Kieszonki z brie'), ('supper', 'Racuchy'),
      ('supper', 'Śledzik'), ('supper', 'Pierogi'), ('supper', 'Pizza ze skyru'), ('supper', 'Frytki z batatów'),
      ('supper', 'Hot dogi'), ('supper', 'Shakshuka'), ('supper', 'Jajka faszerowane'), ('supper', 'Tosty')
  `);
  db.close();
}

export function clearAllowance() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM allowance_transactions").run();
  db.prepare("DELETE FROM allowance_config").run();
  db.close();
}

export function clearBills() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM bills_transactions").run();
  db.prepare("DELETE FROM bills_config").run();
  db.close();
}

export function setupBillsConfig(day_of_month: number = 15) {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM bills_config").run();
  db.prepare("INSERT INTO bills_config (day_of_month) VALUES (?)").run(day_of_month);
  db.close();
}

export function addBillsPeriodStartMarker(created_at?: number) {
  const db = new Database(DB_PATH);
  const timestamp = created_at ?? Math.floor(Date.now() / 1000);
  db.prepare("INSERT INTO bills_transactions (description, amount, is_automatic, created_at) VALUES ('Period start', 0, 1, ?)").run(timestamp);
  db.close();
}

export function addBillTransactionSql(description: string, amount: number, is_automatic: boolean = false, created_at?: number) {
  const db = new Database(DB_PATH);
  const timestamp = created_at ?? Math.floor(Date.now() / 1000);
  db.prepare("INSERT INTO bills_transactions (description, amount, is_automatic, created_at) VALUES (?, ?, ?, ?)").run(description, amount, is_automatic ? 1 : 0, timestamp);
  db.close();
}

export function clearBalance() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM balance_transactions").run();
  db.prepare("DELETE FROM balance_config").run();
  db.close();
}

export function setupBalanceConfig(day_of_month: number = 15) {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM balance_config").run();
  db.prepare("INSERT INTO balance_config (day_of_month) VALUES (?)").run(day_of_month);
  db.close();
}

export function addBalancePeriodStartMarker(created_at?: number) {
  const db = new Database(DB_PATH);
  const timestamp = created_at ?? Math.floor(Date.now() / 1000);
  db.prepare("INSERT INTO balance_transactions (description, amount, is_automatic, created_at) VALUES ('Period start', 0, 1, ?)").run(timestamp);
  db.close();
}

export function addBalanceTransactionSql(description: string, amount: number, is_automatic: boolean = false, created_at?: number) {
  const db = new Database(DB_PATH);
  const timestamp = created_at ?? Math.floor(Date.now() / 1000);
  db.prepare("INSERT INTO balance_transactions (description, amount, is_automatic, created_at) VALUES (?, ?, ?, ?)").run(description, amount, is_automatic ? 1 : 0, timestamp);
  db.close();
}

export function setupAllowanceConfig(day_of_month: number, monthly_amount: number) {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM allowance_config").run();
  db.prepare("INSERT INTO allowance_config (day_of_month, monthly_amount) VALUES (?, ?)").run(day_of_month, monthly_amount);
  db.close();
}

export function addAllowanceTransactionSql(type: string, description: string, amount: number, is_automatic: boolean = false, created_at?: number) {
  const db = new Database(DB_PATH);
  // Get current balance
  const lastTx = db.prepare("SELECT balance_after FROM allowance_transactions ORDER BY id DESC LIMIT 1").get() as { balance_after: number } | undefined;
  const currentBalance = lastTx ? lastTx.balance_after :0;

  let newBalance: number;
  if (type === "expense") {
    newBalance = currentBalance - amount;
  } else {
    newBalance = currentBalance + amount;
  }

  const timestamp = created_at ?? Math.floor(Date.now() / 1000);

  db.prepare(
    "INSERT INTO allowance_transactions (type, description, amount, balance_after, is_automatic, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(type, description, amount, newBalance, is_automatic ? 1 : 0, timestamp);
  db.close();
}

export function clearAll() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM parcels").run();
  db.prepare("DELETE FROM plan_items").run();
  db.prepare("DELETE FROM plan_lists").run();
  db.prepare("DELETE FROM meals").run();
  db.prepare("DELETE FROM allowance_transactions").run();
  db.prepare("DELETE FROM allowance_config").run();
  db.prepare("DELETE FROM bills_automatic_payments").run();
  db.close();
}

// ADR-023: Automatic Payments helpers

export function clearBillsAutomaticPayments() {
  const db = new Database(DB_PATH);
  db.prepare("DELETE FROM bills_automatic_payments").run();
  db.close();
}

export function addBillsAutomaticPaymentSql(name: string, slug: string, amount: number) {
  const db = new Database(DB_PATH);
  db.prepare("INSERT INTO bills_automatic_payments (name, slug, amount) VALUES (?, ?, ?)").run(name, slug, amount);
  db.close();
}