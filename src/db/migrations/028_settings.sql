-- Migration: 028_settings.sql
-- Description: Create settings table for personalization (hidden nav tabs).

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
