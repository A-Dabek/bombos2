CREATE TABLE groceries_ingredient_aliases (
  normalized_alias TEXT PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
