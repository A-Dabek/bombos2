CREATE TABLE groceries_product_counts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL,
    buy_count INTEGER NOT NULL DEFAULT 0
);
