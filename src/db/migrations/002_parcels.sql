CREATE TABLE IF NOT EXISTS parcels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('incoming', 'outgoing')),
  image BLOB NOT NULL,
  content_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
