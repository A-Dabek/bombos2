import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { normalizeProductName } from "../utils/groceries.ts";
import { getActiveShop, setActiveShop } from "./settings.ts";

export interface Shop {
  id: number;
  name: string;
  created_at: number;
}

export interface Aisle {
  id: number;
  shop_id: number;
  name: string;
  sort_order: number;
}

export type DeleteShopResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "last_shop" };

export function getShops(db?: Database.Database): Shop[] {
  const dbConn = db ?? getDb();
  return dbConn
    .prepare("SELECT id, name, created_at FROM shops ORDER BY id")
    .all() as Shop[];
}

export function getShopById(id: number, db?: Database.Database): Shop | undefined {
  const dbConn = db ?? getDb();
  return dbConn
    .prepare("SELECT id, name, created_at FROM shops WHERE id = ?")
    .get(id) as Shop | undefined;
}

export function createShop(name: string, db?: Database.Database): number {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare("INSERT INTO shops (name) VALUES (?)")
    .run(name);
  return result.lastInsertRowid as number;
}

export function updateShop(
  id: number,
  name: string,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare("UPDATE shops SET name = ? WHERE id = ?")
    .run(name, id);
  return result.changes > 0;
}

export function deleteShop(id: number, db?: Database.Database): DeleteShopResult {
  const dbConn = db ?? getDb();
  const shop = getShopById(id, dbConn);
  if (!shop) return { ok: false, reason: "not_found" };

  const count = (
    dbConn.prepare("SELECT COUNT(*) AS count FROM shops").get() as {
      count: number;
    }
  ).count;
  if (count <= 1) return { ok: false, reason: "last_shop" };

  const tx = dbConn.transaction(() => {
    dbConn.prepare("DELETE FROM shop_aisles WHERE shop_id = ?").run(id);
    dbConn.prepare("DELETE FROM groceries_item_aisles WHERE shop_id = ?").run(id);
    dbConn.prepare("DELETE FROM groceries_product_aisles WHERE shop_id = ?").run(id);
    dbConn.prepare("DELETE FROM groceries_completed_aisles WHERE shop_id = ?").run(id);
    dbConn.prepare("DELETE FROM shops WHERE id = ?").run(id);

    if (getActiveShop("default", dbConn) === id) {
      const next = dbConn
        .prepare("SELECT id FROM shops ORDER BY id LIMIT 1")
        .get() as { id: number } | undefined;
      if (next) setActiveShop(next.id, dbConn);
    }
  });
  tx();
  return { ok: true };
}

export function getAisles(shopId: number, db?: Database.Database): Aisle[] {
  const dbConn = db ?? getDb();
  return dbConn
    .prepare(
      "SELECT id, shop_id, name, sort_order FROM shop_aisles WHERE shop_id = ? ORDER BY sort_order, id",
    )
    .all(shopId) as Aisle[];
}

export function getAisleById(
  id: number,
  db?: Database.Database,
): Aisle | undefined {
  const dbConn = db ?? getDb();
  return dbConn
    .prepare("SELECT id, shop_id, name, sort_order FROM shop_aisles WHERE id = ?")
    .get(id) as Aisle | undefined;
}

export function createAisle(
  shopId: number,
  name: string,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const next = (
    dbConn
      .prepare(
        "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM shop_aisles WHERE shop_id = ?",
      )
      .get(shopId) as { next: number }
  ).next;
  const result = dbConn
    .prepare("INSERT INTO shop_aisles (shop_id, name, sort_order) VALUES (?, ?, ?)")
    .run(shopId, name, next);
  return result.lastInsertRowid as number;
}

export function updateAisle(
  id: number,
  name: string,
  db?: Database.Database,
): boolean {
  const dbConn = db ?? getDb();
  const result = dbConn
    .prepare("UPDATE shop_aisles SET name = ? WHERE id = ?")
    .run(name, id);
  return result.changes > 0;
}

export function reorderAisles(
  shopId: number,
  orderedIds: number[],
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  const update = dbConn.prepare(
    "UPDATE shop_aisles SET sort_order = ? WHERE id = ? AND shop_id = ?",
  );
  const tx = dbConn.transaction(() => {
    orderedIds.forEach((aisleId, index) => {
      update.run(index, aisleId, shopId);
    });
  });
  tx();
}

export function deleteAisle(id: number, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const tx = dbConn.transaction(() => {
    dbConn.prepare("DELETE FROM groceries_item_aisles WHERE aisle_id = ?").run(id);
    dbConn.prepare("DELETE FROM groceries_product_aisles WHERE aisle_id = ?").run(id);
    dbConn.prepare("DELETE FROM groceries_completed_aisles WHERE aisle_id = ?").run(id);
    return dbConn.prepare("DELETE FROM shop_aisles WHERE id = ?").run(id).changes > 0;
  });
  return tx();
}

export function getAisleItemCounts(
  shopId: number,
  db?: Database.Database,
): Record<number, number> {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare(
      "SELECT aisle_id, COUNT(*) AS count FROM groceries_item_aisles WHERE shop_id = ? GROUP BY aisle_id",
    )
    .all(shopId) as { aisle_id: number; count: number }[];
  const counts: Record<number, number> = {};
  for (const row of rows) counts[row.aisle_id] = row.count;
  return counts;
}

export function getItemAisleMap(
  shopId: number,
  db?: Database.Database,
): Map<number, number> {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare(
      "SELECT item_id, aisle_id FROM groceries_item_aisles WHERE shop_id = ?",
    )
    .all(shopId) as { item_id: number; aisle_id: number }[];
  return new Map(rows.map((row) => [row.item_id, row.aisle_id]));
}

export function setItemAisle(
  itemId: number,
  shopId: number,
  aisleId: number,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  dbConn
    .prepare(
      "INSERT INTO groceries_item_aisles (item_id, shop_id, aisle_id) VALUES (?, ?, ?) ON CONFLICT(item_id, shop_id) DO UPDATE SET aisle_id = excluded.aisle_id",
    )
    .run(itemId, shopId, aisleId);
}

export function clearItemAisle(
  itemId: number,
  shopId: number,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  dbConn
    .prepare("DELETE FROM groceries_item_aisles WHERE item_id = ? AND shop_id = ?")
    .run(itemId, shopId);
}

export function saveProductAisle(
  name: string,
  shopId: number,
  aisleId: number,
  manual: boolean,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  if (manual) {
    dbConn
      .prepare(
        "INSERT INTO groceries_product_aisles (normalized_name, shop_id, aisle_id) VALUES (?, ?, ?) ON CONFLICT(normalized_name, shop_id) DO UPDATE SET aisle_id = excluded.aisle_id, last_used = unixepoch()",
      )
      .run(normalized, shopId, aisleId);
  } else {
    dbConn
      .prepare(
        "INSERT INTO groceries_product_aisles (normalized_name, shop_id, aisle_id) VALUES (?, ?, ?) ON CONFLICT(normalized_name, shop_id) DO NOTHING",
      )
      .run(normalized, shopId, aisleId);
  }
}

export function getSuggestedAisle(
  name: string,
  shopId: number,
  db?: Database.Database,
): number | null {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  const row = dbConn
    .prepare(
      "SELECT aisle_id FROM groceries_product_aisles WHERE normalized_name = ? AND shop_id = ?",
    )
    .get(normalized, shopId) as { aisle_id: number } | undefined;
  return row?.aisle_id ?? null;
}

export function getCompletedAisles(
  shopId: number,
  db?: Database.Database,
): number[] {
  const dbConn = db ?? getDb();
  const rows = dbConn
    .prepare(
      "SELECT aisle_id FROM groceries_completed_aisles WHERE shop_id = ?",
    )
    .raw(true)
    .all(shopId) as number[][];
  return rows.map((row) => row[0]);
}

export function setAisleCompleted(
  shopId: number,
  aisleId: number,
  completed: boolean,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  if (completed) {
    dbConn
      .prepare(
        "INSERT OR IGNORE INTO groceries_completed_aisles (shop_id, aisle_id) VALUES (?, ?)",
      )
      .run(shopId, aisleId);
  } else {
    dbConn
      .prepare(
        "DELETE FROM groceries_completed_aisles WHERE shop_id = ? AND aisle_id = ?",
      )
      .run(shopId, aisleId);
  }
}
