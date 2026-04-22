import { DB } from "sqlite";

export async function runMigrations(db: DB): Promise<void> {
  db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `);

  const appliedRows = [...db.query("SELECT name FROM _migrations")];
  const applied = new Set(appliedRows.map((row) => row[0] as string));

  const migrationFiles: string[] = [];
  for await (const entry of Deno.readDir("src/db/migrations")) {
    if (entry.isFile && entry.name.endsWith(".sql")) {
      migrationFiles.push(entry.name);
    }
  }
  migrationFiles.sort();

  for (const file of migrationFiles) {
    if (applied.has(file)) continue;

    const sql = await Deno.readTextFile(`src/db/migrations/${file}`);

    db.transaction(() => {
      db.execute(sql);
      db.query(
        "INSERT INTO _migrations (name, applied_at) VALUES (?, ?)",
        [file, Date.now()],
      );
    });
  }
}
