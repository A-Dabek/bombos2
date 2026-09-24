CREATE TABLE shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE TABLE shop_aisles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_shop_aisles_shop ON shop_aisles(shop_id, sort_order);
CREATE TABLE groceries_item_aisles (
  item_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, aisle_id INTEGER NOT NULL,
  PRIMARY KEY (item_id, shop_id)
);
CREATE INDEX idx_item_aisles_shop_aisle ON groceries_item_aisles(shop_id, aisle_id);
CREATE TABLE groceries_product_aisles (
  normalized_name TEXT NOT NULL, shop_id INTEGER NOT NULL, aisle_id INTEGER NOT NULL,
  last_used INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (normalized_name, shop_id)
);
CREATE TABLE groceries_completed_aisles (
  shop_id INTEGER NOT NULL, aisle_id INTEGER NOT NULL,
  PRIMARY KEY (shop_id, aisle_id)
);
INSERT INTO shops (id, name) VALUES (1, 'Lidl');
INSERT INTO settings (key, user_email, value) VALUES ('active_shop', 'default', '1');
