import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { runMigrations } from "./migrations.ts";

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;
  dbInstance = openDb("./data/app.db");
  return dbInstance;
}

export function openDb(path: string): Database.Database {
  if (path === "./data/app.db") {
    mkdirSync("./data", { recursive: true });
  }
  const db = new Database(path);
  runMigrations(db);
  return db;
}

export function resetDb(): void {
  dbInstance = null;
}

export function withDb<T>(db: Database.Database | undefined, fn: (db: Database.Database) => T): T {
  return fn(db ?? getDb());
}
