import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

const HIDDEN_TABS_KEY = "hidden_tabs";

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
