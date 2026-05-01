-- Drop updated_at column from allowance_config
-- ADR-017: Remove unused field

CREATE TABLE allowance_config_new (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_of_month INTEGER NOT NULL DEFAULT 15,
  monthly_amount INTEGER NOT NULL DEFAULT 600
);

INSERT INTO allowance_config_new (id, day_of_month, monthly_amount)
SELECT id, day_of_month, monthly_amount FROM allowance_config;

DROP TABLE allowance_config;
ALTER TABLE allowance_config_new RENAME TO allowance_config;

INSERT OR IGNORE INTO allowance_config (id, day_of_month, monthly_amount) VALUES (1, 15, 600);
