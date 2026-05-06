-- Add urgent column and remove amount column from plan_items
-- SQLite requires recreating the table to drop a column

ALTER TABLE plan_items RENAME TO plan_items_old;

CREATE TABLE plan_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  list_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  urgent INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (list_id) REFERENCES plan_lists(id) ON DELETE CASCADE
);

INSERT INTO plan_items (id, list_id, name, description, created_at)
SELECT id, list_id, name, description, created_at FROM plan_items_old;

DROP TABLE plan_items_old;