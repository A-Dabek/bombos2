-- Migration: Seed plan lists with data from Bombos 1 export
-- Lists with emojis have the emoji moved to the first character

DELETE FROM plan_lists;

INSERT INTO plan_lists (id, title, display_order, created_at) VALUES
  (1, '👻Pepco', 0, unixepoch()),
  (2, '💊Apteka', 1, unixepoch()),
  (3, '👽Leroy Merlin', 3, unixepoch()),
  (4, '🧴Drogeryjne', 4, unixepoch());
