-- Migration: Create meals table with seed data
-- Task 1: Database Schema, Seed Data, and DAL

CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('breakfast', 'dinner', 'supper')),
  name TEXT NOT NULL
);

-- Seed 9 meals (3 per category)
INSERT INTO meals (category, name) VALUES
  ('breakfast', 'Scrambled Eggs'),
  ('breakfast', 'Oatmeal with Berries'),
  ('breakfast', 'Avocado Toast'),
  ('dinner', 'Grilled Chicken Salad'),
  ('dinner', 'Pasta Carbonara'),
  ('dinner', 'Vegetable Stir-Fry'),
  ('supper', 'Greek Yogurt'),
  ('supper', 'Tomato Soup'),
  ('supper', 'Cheese Sandwich');