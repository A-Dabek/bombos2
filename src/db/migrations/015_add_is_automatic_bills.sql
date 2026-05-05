-- ADR-020 Iteration 2: Add is_automatic column to bills_transactions

ALTER TABLE bills_transactions ADD COLUMN is_automatic INTEGER NOT NULL DEFAULT 0;

-- Seed initial period marker: May 15, 2026 (start of known period)
INSERT OR IGNORE INTO bills_transactions (description, amount, is_automatic, created_at)
VALUES ('Period start', 0, 1, strftime('%s', '2026-05-15'));