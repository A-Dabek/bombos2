-- Migration: 022_import_historical_bills_transactions.sql
-- Description: Seed predefined payments (gas, electricity, water) + import historical bills transactions
-- Includes 22 period starts and 84 transactions (Jul 2024 – Apr 2026)

-- Seed predefined payments for slugs
INSERT OR IGNORE INTO bills_predefined_payments (name, slug) VALUES
  ('Gaz', 'gas'),
  ('Prąd', 'electricity'),
  ('Woda', 'water');

-- Period starts and transactions (oldest → newest)
INSERT INTO bills_transactions (description, amount, created_at, is_automatic, predefined_slug) VALUES
  -- Period start 2024-07-14
  ('Period start', 0, 1720994400, 1, NULL),
  ('Woda', -89, 1720994400, 0, 'water'),
  ('Internet', -99, 1720994400, 0, NULL),
  ('Gaz', -704, 1720994400, 0, 'gas'),
  -- Period start 2024-08-14
  ('Period start', 0, 1723672800, 1, NULL),
  ('Światłowód', -75, 1723672800, 0, NULL),
  ('Woda', -135, 1723672800, 0, 'water'),
  ('OneDrive', -215, 1723672800, 0, NULL),
  ('Czynsz', -250, 1723672800, 0, NULL),
  ('Prąd', -790, 1723672800, 0, 'electricity'),
  -- Period start 2024-09-14
  ('Period start', 0, 1726351200, 1, NULL),
  ('Internet', -75, 1726351200, 0, NULL),
  ('Woda', -136, 1726351200, 0, 'water'),
  ('Czynsz', -250, 1726351200, 0, NULL),
  ('Gaz', -335, 1726351200, 0, 'gas'),
  ('Rata', -680, 1726351200, 0, NULL),
  -- Period start 2024-10-14
  ('Period start', 0, 1728943200, 1, NULL),
  ('Internet', -75, 1728943200, 0, NULL),
  ('Woda', -146, 1728943200, 0, 'water'),
  ('Czynsz', -250, 1728943200, 0, NULL),
  ('Prąd', -561, 1728943200, 0, 'electricity'),
  ('Rata', -680, 1728943200, 0, NULL),
  -- Period start 2024-11-14
  ('Period start', 0, 1731625200, 1, NULL),
  ('Woda', -88, 1731625200, 0, 'water'),
  ('Stałe', -325, 1731625200, 0, NULL),
  ('Rata', -680, 1731625200, 0, NULL),
  ('Gaz', -706, 1731625200, 0, 'gas'),
  -- Period start 2024-12-14
  ('Period start', 0, 1734217200, 1, NULL),
  ('Woda', -185, 1734217200, 0, 'water'),
  ('Stałe', -325, 1734217200, 0, NULL),
  ('Prąd', -404, 1734217200, 0, 'electricity'),
  ('Rata', -680, 1734217200, 0, NULL),
  -- Period start 2025-01-14
  ('Period start', 0, 1736895600, 1, NULL),
  ('Woda', -127, 1736895600, 0, 'water'),
  ('Stałe', -325, 1736895600, 0, NULL),
  ('Rata', -680, 1736895600, 0, NULL),
  ('Gaz', -706, 1736895600, 0, 'gas'),
  -- Period start 2025-02-14
  ('Period start', 0, 1739574000, 1, NULL),
  ('Peka', -100, 1739574000, 0, NULL),
  ('Woda', -180, 1739574000, 0, 'water'),
  ('Stałe', -325, 1739574000, 0, NULL),
  ('Prąd', -424, 1739574000, 0, 'electricity'),
  ('Rata', -680, 1739574000, 0, NULL),
  -- Period start 2025-03-14
  ('Period start', 0, 1741993200, 1, NULL),
  ('Media', -95, 1741993200, 0, NULL),
  ('Woda', -127, 1741993200, 0, 'water'),
  ('Czynsz', -250, 1741993200, 0, NULL),
  ('Gaz', -683, 1741993200, 0, 'gas'),
  -- Period start 2025-04-14
  ('Period start', 0, 1744668000, 1, NULL),
  ('Woda', -216, 1744668000, 0, 'water'),
  ('Media czynsz', -350, 1744668000, 0, NULL),
  ('Prąd', -482, 1744668000, 0, 'electricity'),
  -- Period start 2025-05-14
  ('Period start', 0, 1747260000, 1, NULL),
  ('Woda', -126, 1747260000, 0, 'water'),
  ('Media czynsz', -350, 1747260000, 0, NULL),
  ('Gaz', -706, 1747260000, 0, 'gas'),
  -- Period start 2025-06-14
  ('Period start', 0, 1749938400, 1, NULL),
  ('Rata suszarka', -200, 1749938400, 0, NULL),
  ('Woda', -240, 1749938400, 0, 'water'),
  ('Media czynsz', -350, 1749938400, 0, NULL),
  ('Prąd', -500, 1749938400, 0, 'electricity'),
  -- Period start 2025-07-14
  ('Period start', 0, 1752530400, 1, NULL),
  ('Woda', -100, 1752530400, 0, 'water'),
  ('Rata suszarka', -200, 1752530400, 0, NULL),
  ('Media czynsz', -350, 1752530400, 0, NULL),
  ('Gaz', -700, 1752530400, 0, 'gas'),
  -- Period start 2025-08-14
  ('Period start', 0, 1755208800, 1, NULL),
  ('Woda', -185, 1755208800, 0, 'water'),
  ('Rata suszarka', -200, 1755208800, 0, NULL),
  ('Media czynsz', -350, 1755208800, 0, NULL),
  ('Prąd', -750, 1755208800, 0, 'electricity'),
  -- Period start 2025-09-14
  ('Period start', 0, 1757887200, 1, NULL),
  ('Gaz', 0, 1757887200, 0, 'gas'),
  ('Woda', -133, 1757887200, 0, 'water'),
  ('Rata suszarka', -200, 1757887200, 0, NULL),
  ('Tele czynsz', -350, 1757887200, 0, NULL),
  -- Period start 2025-10-14
  ('Period start', 0, 1760479200, 1, NULL),
  ('Rata', -200, 1760479200, 0, NULL),
  ('Woda', -290, 1760479200, 0, 'water'),
  ('Teleczynsz', -350, 1760479200, 0, NULL),
  ('Prąd', -643, 1760479200, 0, 'electricity'),
  -- Period start 2025-11-14
  ('Period start', 0, 1763161200, 1, NULL),
  ('Woda', 0, 1763161200, 0, 'water'),
  ('Gaz', 0, 1763161200, 0, 'gas'),
  ('Rata', -200, 1763161200, 0, NULL),
  ('Tele czynsz', -350, 1763161200, 0, NULL),
  ('Prąd', -500, 1763161200, 0, 'electricity'),
  -- Period start 2025-12-14
  ('Period start', 0, 1765753200, 1, NULL),
  ('Woda', -180, 1765753200, 0, 'water'),
  ('Rata', -200, 1765753200, 0, NULL),
  ('Media', -350, 1765753200, 0, NULL),
  -- Period start 2026-01-14
  ('Period start', 0, 1768431600, 1, NULL),
  ('Woda', -150, 1768431600, 0, 'water'),
  ('Media', -350, 1768431600, 0, NULL),
  ('Gaz', -460, 1768431600, 0, 'gas'),
  -- Period start 2026-02-14
  ('Period start', 0, 1771110000, 1, NULL),
  ('Woda', -263, 1771110000, 0, 'water'),
  ('Media', -350, 1771110000, 0, NULL),
  ('Prąd', -657, 1771110000, 0, 'electricity'),
  -- Period start 2026-03-14
  ('Period start', 0, 1773529200, 1, NULL),
  ('Woda', -114, 1773529200, 0, 'water'),
  ('Media', -350, 1773529200, 0, NULL),
  ('Gaz', -444, 1773529200, 0, 'gas'),
  -- Period start 2026-04-14
  ('Period start', 0, 1776204000, 1, NULL),
  ('Woda', -200, 1776204000, 0, 'water'),
  ('Prąd', -573, 1776204000, 0, 'electricity');
