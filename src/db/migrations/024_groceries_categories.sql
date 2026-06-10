-- Add category to groceries_items
ALTER TABLE groceries_items ADD COLUMN category TEXT;

-- Create table for product category mappings
CREATE TABLE groceries_product_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL
);
