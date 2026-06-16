-- Migration: 026_negate_positive_amounts.sql
-- Description: Normalize existing data for bills and balance by negating any positive amounts.
-- As per requirements, these modules should only contain negative amounts (expenses).

UPDATE balance_transactions 
SET amount = -amount 
WHERE amount > 0 AND description != 'Period start';

UPDATE bills_transactions 
SET amount = -amount 
WHERE amount > 0 AND description != 'Period start';

-- Also normalize bills_automatic_payments if any were stored as positive
-- although the system currently expects them positive, we will align them 
-- to be negative to match the 'only negative amounts' rule for these modules.
UPDATE bills_automatic_payments 
SET amount = -amount 
WHERE amount > 0;
