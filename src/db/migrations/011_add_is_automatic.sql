-- Add is_automatic flag to allowance_transactions
ALTER TABLE allowance_transactions ADD COLUMN is_automatic INTEGER DEFAULT 0;

-- Update existing allowance-type transactions to be automatic (they were added by scheduler)
UPDATE allowance_transactions SET is_automatic = 1 WHERE type = 'allowance';
