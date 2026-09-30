CREATE TABLE groceries_purchase_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  bought_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_purchase_log_norm ON groceries_purchase_log(normalized_name, bought_at DESC);
