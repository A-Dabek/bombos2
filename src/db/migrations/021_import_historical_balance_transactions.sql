-- Migration: 021_import_historical_balance_transactions.sql
-- Description: Import 70 historical balance transactions + 22 period start markers (Jul 2024 – Apr 2026)
-- Order: oldest period first → newest last (id ASC matches chronology)

INSERT INTO balance_transactions (description, amount, created_at, is_automatic) VALUES
  -- Period start 2024-07-14
  ('Period start', 0, 1720994400, 1),
  ('Woodstock', -350, 1720994400, 0),
  ('Mata dla psa', -350, 1720994400, 0),
  ('Pogrzeb babci', -750, 1720994400, 0),
  -- Period start 2024-08-14
  ('Period start', 0, 1723672800, 1),
  ('Huel', -240, 1723672800, 0),
  ('Eneida badanie', -250, 1723672800, 0),
  ('Fertilman', -300, 1723672800, 0),
  ('Serwis pieca', -470, 1723672800, 0),
  ('Konrad wesele', -500, 1723672800, 0),
  ('Eneida', -1100, 1723672800, 0),
  -- Period start 2024-09-14
  ('Period start', 0, 1726351200, 1),
  ('Leki in vitro', -250, 1726351200, 0),
  ('Medalik', -300, 1726351200, 0),
  ('Fizjo babcia', -360, 1726351200, 0),
  ('Leki in vitro', -450, 1726351200, 0),
  ('Petsy', -600, 1726351200, 0),
  ('Badanie dna', -1000, 1726351200, 0),
  -- Period start 2024-10-14
  ('Period start', 0, 1728943200, 1),
  ('Terapia', -170, 1728943200, 0),
  ('Lek in vitro', -180, 1728943200, 0),
  ('Leki ivf', -250, 1728943200, 0),
  ('Kariotyp', -550, 1728943200, 0),
  -- Period start 2024-11-14
  ('Period start', 0, 1731625200, 1),
  ('Bilety lotnicze', -550, 1731625200, 0),
  ('Prezenty', -650, 1731625200, 0),
  -- Period start 2024-12-14
  ('Period start', 0, 1734217200, 1),
  ('Stomatolog Mysza', -170, 1734217200, 0),
  ('Kurtka Adrian', -250, 1734217200, 0),
  ('Narty booking', -1215, 1734217200, 0),
  -- Period start 2025-01-14
  ('Period start', 0, 1736895600, 1),
  ('Medicover p-ciała', -140, 1736895600, 0),
  ('Narty', -430, 1736895600, 0),
  ('Podatek za dom', -911, 1736895600, 0),
  ('Londyn', -2300, 1736895600, 0),
  -- Period start 2025-02-14
  ('Period start', 0, 1739574000, 1),
  ('Zastrzyk eneida', -110, 1739574000, 0),
  -- Period start 2025-03-14
  ('Period start', 0, 1741993200, 1),
  ('Koncert', -350, 1741993200, 0),
  ('Warszawa', -500, 1741993200, 0),
  ('Dziadyga wypadek', -500, 1741993200, 0),
  ('Kolczyki komunia', -570, 1741993200, 0),
  ('Auto serwis 2', -760, 1741993200, 0),
  ('Eneida badania', -990, 1741993200, 0),
  ('Auto serwis', -1100, 1741993200, 0),
  -- Period start 2025-04-14
  ('Period start', 0, 1744668000, 1),
  ('Urolog', -400, 1744668000, 0),
  ('Przegląd klimy', -500, 1744668000, 0),
  -- Period start 2025-05-14
  ('Period start', 0, 1747260000, 1),
  ('Panele', -400, 1747260000, 0),
  ('Luxmed', -1000, 1747260000, 0),
  ('Kamil stolarka', -1200, 1747260000, 0),
  -- Period start 2025-06-14
  ('Period start', 0, 1749938400, 1),
  ('Furmi uro', -230, 1749938400, 0),
  ('Urodziny taty', -250, 1749938400, 0),
  ('Eneida', -350, 1749938400, 0),
  ('Dzięba urodziny', -400, 1749938400, 0),
  ('Byczki urodziny', -500, 1749938400, 0),
  ('Piec', -590, 1749938400, 0),
  ('Momsclinic', -600, 1749938400, 0),
  ('Prenatalne', -3000, 1749938400, 0),
  -- Period start 2025-07-14
  ('Period start', 0, 1752530400, 1),
  ('Mielno', -830, 1752530400, 0),
  ('Kampery', -1100, 1752530400, 0),
  -- Period start 2025-08-14
  ('Period start', 0, 1755208800, 1),
  ('Eneida', -535, 1755208800, 0),
  -- Period start 2025-09-14
  ('Period start', 0, 1757887200, 1),
  ('Eneida', -400, 1757887200, 0),
  ('Julia prezent', -400, 1757887200, 0),
  ('Restauracja', -400, 1757887200, 0),
  ('Prenatalne', -400, 1757887200, 0),
  ('Auto', -420, 1757887200, 0),
  ('Kawalerski', -450, 1757887200, 0),
  ('Ślub Furmi', -850, 1757887200, 0),
  -- Period start 2025-10-14
  ('Period start', 0, 1760479200, 1),
  ('Urodziny', -400, 1760479200, 0),
  -- Period start 2025-11-14
  ('Period start', 0, 1763161200, 1),
  ('Eneida', -400, 1763161200, 0),
  -- Period start 2025-12-14
  ('Period start', 0, 1765753200, 1),
  ('Petsy', -190, 1765753200, 0),
  ('Eneida', -435, 1765753200, 0),
  ('Mata dla psa', -450, 1765753200, 0),
  ('Żnin', -500, 1765753200, 0),
  ('Mycie auta', -1000, 1765753200, 0),
  -- Period start 2026-01-14
  ('Period start', 0, 1768431600, 1),
  ('Podatek za dom', -460, 1768431600, 0),
  ('Eneida', -465, 1768431600, 0),
  ('Eneida', -840, 1768431600, 0),
  -- Period start 2026-02-14
  ('Period start', 0, 1771110000, 1),
  -- Period start 2026-03-14
  ('Period start', 0, 1773529200, 1),
  ('Plaster po cc', -30, 1773529200, 0),
  -- Period start 2026-04-14
  ('Period start', 0, 1776204000, 1);
