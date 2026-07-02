-- Migration: 027_money_flows.sql
-- Description: Create money_flows table for tracking household money movements.

CREATE TABLE IF NOT EXISTS money_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  description TEXT NOT NULL,
  amount INTEGER NOT NULL,
  day_of_month INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
