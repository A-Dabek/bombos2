-- ADR-019 Iteration 1: Balance Module - Transaction Form + List

CREATE TABLE IF NOT EXISTS balance_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15
);

INSERT OR IGNORE INTO balance_config (id, day_of_month) VALUES (1, 15);

CREATE TABLE IF NOT EXISTS balance_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);