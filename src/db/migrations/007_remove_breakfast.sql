-- Migration: Remove breakfast category
-- ADR-011: Remove breakfast category permanently

-- Step 1: Delete all breakfast rows
DELETE FROM meals WHERE category = 'breakfast';

-- Step 2: Recreate meals table with restricted categories
ALTER TABLE meals RENAME TO meals_old;

CREATE TABLE meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('dinner', 'supper')),
  name TEXT NOT NULL
);

-- Step 3: Copy remaining dinner/supper data
INSERT INTO meals (id, category, name)
SELECT id, category, name FROM meals_old;

-- Step 4: Drop old table
DROP TABLE meals_old;