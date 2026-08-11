import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

const HIDDEN_TABS_KEY = "hidden_tabs";
const THEME_KEY = "theme";

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
