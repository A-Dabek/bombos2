-- ADR-023: Automatic Payments for Bills
CREATE TABLE IF NOT EXISTS bills_automatic_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for slug lookups (used in future aggregation queries)
CREATE INDEX IF NOT EXISTS idx_bills_automatic_payments_slug 
  ON bills_automatic_payments(slug);