import Database from "better-sqlite3";
import { readdirSync, readFileSync } from "node:fs";

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `);

  const appliedRows = db.prepare("SELECT name FROM _migrations").raw(true).all() as string[][];
  const applied = new Set(appliedRows.map((row) => row[0]));

  const entries = readdirSync("src/db/migrations", { withFileTypes: true });
  const migrationFiles: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".sql")) {
      migrationFiles.push(entry.name);
    }
  }
  migrationFiles.sort();

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;

    const sql = readFileSync(`src/db/migrations/${file}`, "utf-8");

    const tx = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)").run(file, Date.now());
    });
    tx();
  }
}
