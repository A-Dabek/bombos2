ALTER TABLE bills_transactions ADD COLUMN predefined_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_bills_transactions_predefined_slug 
  ON bills_transactions(predefined_slug);
