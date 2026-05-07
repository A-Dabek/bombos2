// Drop SQLite DB — next server start re-creates it with all migrations
// Usage: node scripts/reset-db.mjs  |  pnpm reset.db

import { existsSync, unlinkSync } from "node:fs";

const DB_PATH = "./data/app.db";

if (!existsSync(DB_PATH)) {
  console.log("No database to reset.");
  process.exit(0);
}

try {
  unlinkSync(DB_PATH);
  // Clean up stale WAL/SHM files
  for (const extra of [DB_PATH + "-wal", DB_PATH + "-shm"]) {
    try { if (existsSync(extra)) unlinkSync(extra); } catch { /* ignore */ }
  }
  console.log("✓ Database deleted. Next server start will re-run all migrations.");
} catch (err) {
  if (err.code === "EBUSY") {
    console.error("✗ Database locked. Stop dev server / IDE and retry.");
    process.exit(1);
  }
  throw err;
}
