-- Migration: 030_settings_user_dimension.sql
-- Description: Add user_email dimension to settings table for per-account preferences.

CREATE TABLE IF NOT EXISTS settings_new (
  key TEXT NOT NULL,
  user_email TEXT NOT NULL DEFAULT 'default',
  value TEXT NOT NULL,
  PRIMARY KEY (key, user_email)
);

INSERT INTO settings_new (key, user_email, value)
SELECT key, 'default', value FROM settings;

DROP TABLE settings;

ALTER TABLE settings_new RENAME TO settings;
