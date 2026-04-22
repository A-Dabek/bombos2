import { DB } from "sqlite";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { runMigrations } from "./migrations.ts";

let dbInstance: DB | null = null;

export async function getDb(): Promise<DB> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDb("./data/app.db");
  return dbInstance;
}

export async function openDb(path: string): Promise<DB> {
  if (path === "./data/app.db") {
    await ensureDir("./data");
  }
  const db = new DB(path);
  await runMigrations(db);
  return db;
}

export function resetDb(): void {
  dbInstance = null;
}
