CREATE TABLE IF NOT EXISTS bills_predefined_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_bills_predefined_payments_slug 
  ON bills_predefined_payments(slug);
