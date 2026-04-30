-- Migration: Create allowance tables
-- ADR-016: Money Allowance Module

CREATE TABLE IF NOT EXISTS allowance_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15,
  monthly_amount INTEGER NOT NULL DEFAULT 600,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

INSERT OR IGNORE INTO allowance_config (id, day_of_month, monthly_amount) VALUES (1, 15, 600);

CREATE TABLE IF NOT EXISTS allowance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('allowance', 'expense', 'income')),
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
