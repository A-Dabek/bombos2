import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

const HIDDEN_TABS_KEY = "hidden_tabs";

export function getHiddenTabs(db?: Database.Database): string[] {
  const dbConn = db ?? getDb();
  const row = dbConn.prepare("SELECT value FROM settings WHERE key = ?").get(HIDDEN_TABS_KEY) as { value: string } | undefined;
  if (!row) return [];
  try {
    return JSON.parse(row.value) as string[];
  } catch {
    return [];
  }
}

export function setHiddenTabs(tabs: string[], db?: Database.Database): void {
  const dbConn = db ?? getDb();
  dbConn.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  ).run(HIDDEN_TABS_KEY, JSON.stringify(tabs));
}
