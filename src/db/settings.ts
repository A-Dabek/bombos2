import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

const HIDDEN_TABS_KEY = "hidden_tabs";
const THEME_KEY = "theme";
const ACTIVE_SHOP_KEY = "active_shop";
const INVENTORY_WINDOW_DAYS_KEY = "inventory_window_days";

const DEFAULT_INVENTORY_WINDOW_DAYS = 15;
const MIN_INVENTORY_WINDOW_DAYS = 1;
const MAX_INVENTORY_WINDOW_DAYS = 15;

export function getHiddenTabs(email = "default", db?: Database.Database): string[] {
  const dbConn = db ?? getDb();
  const normalizedEmail = (email || "default").toLowerCase();

  let row = dbConn.prepare("SELECT value FROM settings WHERE key = ? AND user_email = ?").get(HIDDEN_TABS_KEY, normalizedEmail) as { value: string } | undefined;
  if (!row && normalizedEmail !== "default") {
    row = dbConn.prepare("SELECT value FROM settings WHERE key = ? AND user_email IN ('default', '')").get(HIDDEN_TABS_KEY) as { value: string } | undefined;
  }
  if (!row) return [];
  try {
    return JSON.parse(row.value) as string[];
  } catch {
    return [];
  }
}

export function setHiddenTabs(emailOrTabs: string | string[], tabsOrDb?: string[] | Database.Database, maybeDb?: Database.Database): void {
  let email = "default";
  let tabs: string[] = [];
  let db: Database.Database | undefined;

  if (Array.isArray(emailOrTabs)) {
    tabs = emailOrTabs;
    db = tabsOrDb as Database.Database | undefined;
  } else {
    email = emailOrTabs;
    tabs = tabsOrDb as string[];
    db = maybeDb;
  }

  const dbConn = db ?? getDb();
  const normalizedEmail = (email || "default").toLowerCase();

  dbConn.prepare(
    "INSERT INTO settings (key, user_email, value) VALUES (?, ?, ?) ON CONFLICT(key, user_email) DO UPDATE SET value = excluded.value",
  ).run(HIDDEN_TABS_KEY, normalizedEmail, JSON.stringify(tabs));
}

export function getTheme(email = "default", db?: Database.Database): "dark" | "light" {
  const dbConn = db ?? getDb();
  const normalizedEmail = (email || "default").toLowerCase();

  let row = dbConn.prepare("SELECT value FROM settings WHERE key = ? AND user_email = ?").get(THEME_KEY, normalizedEmail) as { value: string } | undefined;
  if (!row && normalizedEmail !== "default") {
    row = dbConn.prepare("SELECT value FROM settings WHERE key = ? AND user_email IN ('default', '')").get(THEME_KEY) as { value: string } | undefined;
  }
  if (!row) return "light";
  try {
    const parsed = JSON.parse(row.value);
    if (parsed === "dark" || parsed === "light") return parsed;
  } catch {
    if (row.value === "dark" || row.value === "light") return row.value;
  }
  return "light";
}

export function setTheme(emailOrTheme: string, themeOrDb?: string | Database.Database, maybeDb?: Database.Database): void {
  let email = "default";
  let theme: "dark" | "light" = "light";
  let db: Database.Database | undefined;

  if (emailOrTheme === "dark" || emailOrTheme === "light") {
    theme = emailOrTheme;
    db = themeOrDb as Database.Database | undefined;
  } else {
    email = emailOrTheme;
    theme = (themeOrDb as "dark" | "light") || "light";
    db = maybeDb;
  }

  if (theme !== "dark" && theme !== "light") {
    theme = "light";
  }

  const dbConn = db ?? getDb();
  const normalizedEmail = (email || "default").toLowerCase();

  dbConn.prepare(
    "INSERT INTO settings (key, user_email, value) VALUES (?, ?, ?) ON CONFLICT(key, user_email) DO UPDATE SET value = excluded.value",
  ).run(THEME_KEY, normalizedEmail, JSON.stringify(theme));
}

export function getActiveShop(
  email = "default",
  db?: Database.Database,
): number | null {
  const dbConn = db ?? getDb();
  const normalizedEmail = (email || "default").toLowerCase();

  let row = dbConn
    .prepare("SELECT value FROM settings WHERE key = ? AND user_email = ?")
    .get(ACTIVE_SHOP_KEY, normalizedEmail) as { value: string } | undefined;
  if (!row && normalizedEmail !== "default") {
    row = dbConn
      .prepare(
        "SELECT value FROM settings WHERE key = ? AND user_email IN ('default', '')",
      )
      .get(ACTIVE_SHOP_KEY) as { value: string } | undefined;
  }

  if (row) {
    try {
      const parsed = JSON.parse(row.value);
      if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;
    } catch {
      const parsed = Number(row.value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  const shop = dbConn
    .prepare("SELECT id FROM shops ORDER BY id LIMIT 1")
    .get() as { id: number } | undefined;
  if (shop) {
    setActiveShop(shop.id, dbConn);
    return shop.id;
  }
  return null;
}

export function setActiveShop(id: number, db?: Database.Database): void {
  const dbConn = db ?? getDb();
  dbConn
    .prepare(
      "INSERT INTO settings (key, user_email, value) VALUES (?, ?, ?) ON CONFLICT(key, user_email) DO UPDATE SET value = excluded.value",
    )
    .run(ACTIVE_SHOP_KEY, "default", JSON.stringify(id));
}

function clampInventoryWindowDays(days: number): number {
  if (!Number.isFinite(days)) return DEFAULT_INVENTORY_WINDOW_DAYS;
  return Math.min(
    MAX_INVENTORY_WINDOW_DAYS,
    Math.max(MIN_INVENTORY_WINDOW_DAYS, Math.round(days)),
  );
}

export function getInventoryWindowDays(
  email = "default",
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const normalizedEmail = (email || "default").toLowerCase();

  let row = dbConn
    .prepare("SELECT value FROM settings WHERE key = ? AND user_email = ?")
    .get(INVENTORY_WINDOW_DAYS_KEY, normalizedEmail) as { value: string } | undefined;
  if (!row && normalizedEmail !== "default") {
    row = dbConn
      .prepare("SELECT value FROM settings WHERE key = ? AND user_email IN ('default', '')")
      .get(INVENTORY_WINDOW_DAYS_KEY) as { value: string } | undefined;
  }
  if (!row) return DEFAULT_INVENTORY_WINDOW_DAYS;
  try {
    const parsed = JSON.parse(row.value);
    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return clampInventoryWindowDays(parsed);
    }
  } catch {
    const parsed = Number(row.value);
    if (Number.isFinite(parsed)) return clampInventoryWindowDays(parsed);
  }
  return DEFAULT_INVENTORY_WINDOW_DAYS;
}

export function setInventoryWindowDays(days: number, db?: Database.Database): void {
  const dbConn = db ?? getDb();
  dbConn
    .prepare(
      "INSERT INTO settings (key, user_email, value) VALUES (?, ?, ?) ON CONFLICT(key, user_email) DO UPDATE SET value = excluded.value",
    )
    .run(INVENTORY_WINDOW_DAYS_KEY, "default", JSON.stringify(clampInventoryWindowDays(days)));
}
