import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { normalizeProductName } from "../utils/groceries.ts";
import { saveIngredientAlias } from "./groceries-import.ts";

export interface MergeCandidate {
  name: string;
  normalized: string;
  buyCount: number;
  onList: boolean;
}

interface CountRow {
  name: string;
  normalized_name: string;
  buy_count: number;
}

interface ProductAisleRow {
  normalized_name: string;
  shop_id: number;
  aisle_id: number;
  last_used: number;
}

interface AliasRow {
  normalized_alias: string;
  canonical_name: string;
}

interface ItemRow {
  id: number;
  name: string;
}

export function listMergeCandidates(db?: Database.Database): MergeCandidate[] {
  const dbConn = db ?? getDb();
  const seen = new Map<string, MergeCandidate>();

  const add = (
    name: string,
    buyCount: number,
    onList: boolean,
    normalized?: string,
  ) => {
    const norm = normalized ?? normalizeProductName(name);
    if (!norm) return;
    const existing = seen.get(norm);
    if (existing) {
      if (onList) existing.onList = true;
      if (buyCount > existing.buyCount) existing.buyCount = buyCount;
      return;
    }
    seen.set(norm, { name, normalized: norm, buyCount, onList });
  };

  const counts = dbConn
    .prepare("SELECT name, normalized_name, buy_count FROM groceries_product_counts")
    .all() as CountRow[];
  for (const row of counts) {
    add(row.name, row.buy_count, false, row.normalized_name);
  }

  const items = dbConn.prepare("SELECT DISTINCT name FROM groceries_items").all() as {
    name: string;
  }[];
  for (const row of items) {
    add(row.name, 0, true);
  }

  const aliases = dbConn
    .prepare("SELECT DISTINCT canonical_name FROM groceries_ingredient_aliases")
    .all() as { canonical_name: string }[];
  for (const row of aliases) {
    add(row.canonical_name, 0, false);
  }

  return [...seen.values()].sort(
    (a, b) => b.buyCount - a.buyCount || a.name.localeCompare(b.name, "pl"),
  );
}

export function mergeGroceryProducts(
  targetName: string,
  sourceNames: string[],
  db?: Database.Database,
): { merged: number; target: string } {
  const dbConn = db ?? getDb();
  const targetNorm = normalizeProductName(targetName);

  const sourceDisplay = new Map<string, string>();
  for (const raw of sourceNames) {
    const norm = normalizeProductName(raw);
    if (!norm || norm === targetNorm || sourceDisplay.has(norm)) continue;
    sourceDisplay.set(norm, raw);
  }
  const sources = [...sourceDisplay.keys()];
  if (sources.length === 0) return { merged: 0, target: targetName };

  const inSql = sources.map(() => "?").join(", ");
  const sourceSet = new Set(sources);

  const run = dbConn.transaction(() => {
    // 1) product_counts — sum counts onto target, drop source rows.
    const targetRow = dbConn
      .prepare(
        "SELECT name, buy_count FROM groceries_product_counts WHERE normalized_name = ?",
      )
      .get(targetNorm) as { name: string; buy_count: number } | undefined;
    const sum = (
      dbConn
        .prepare(
          `SELECT COALESCE(SUM(buy_count), 0) AS n FROM groceries_product_counts WHERE normalized_name IN (${inSql})`,
        )
        .get(...sources) as { n: number }
    ).n;

    if (targetRow) {
      dbConn
        .prepare(
          "UPDATE groceries_product_counts SET name = ?, buy_count = buy_count + ? WHERE normalized_name = ?",
        )
        .run(targetName, sum, targetNorm);
    } else {
      dbConn
        .prepare(
          "INSERT INTO groceries_product_counts (name, normalized_name, buy_count) VALUES (?, ?, ?)",
        )
        .run(targetName, targetNorm, sum);
    }
    dbConn
      .prepare(
        `DELETE FROM groceries_product_counts WHERE normalized_name IN (${inSql})`,
      )
      .run(...sources);

    // 2) purchase_log — rewrite source events to the target (recency becomes the max).
    dbConn
      .prepare(
        `UPDATE groceries_purchase_log SET name = ?, normalized_name = ? WHERE normalized_name IN (${inSql})`,
      )
      .run(targetName, targetNorm, ...sources);

    // 3) product_aisles — per shop, keep target's mapping if present, else the
    // most recently used source mapping.
    const targetShops = new Set(
      (
        dbConn
          .prepare(
            "SELECT shop_id FROM groceries_product_aisles WHERE normalized_name = ?",
          )
          .all(targetNorm) as { shop_id: number }[]
      ).map((row) => row.shop_id),
    );
    const sourceRows = dbConn
      .prepare(
        `SELECT normalized_name, shop_id, aisle_id, last_used FROM groceries_product_aisles WHERE normalized_name IN (${inSql})`,
      )
      .all(...sources) as ProductAisleRow[];

    const byShop = new Map<number, ProductAisleRow[]>();
    for (const row of sourceRows) {
      const list = byShop.get(row.shop_id);
      if (list) list.push(row);
      else byShop.set(row.shop_id, [row]);
    }

    const deleteAisle = dbConn.prepare(
      "DELETE FROM groceries_product_aisles WHERE normalized_name = ? AND shop_id = ?",
    );
    const repointAisle = dbConn.prepare(
      "UPDATE groceries_product_aisles SET normalized_name = ? WHERE normalized_name = ? AND shop_id = ?",
    );

    for (const [shopId, rows] of byShop) {
      if (targetShops.has(shopId)) {
        for (const row of rows) deleteAisle.run(row.normalized_name, shopId);
        continue;
      }
      let keep = rows[0];
      for (const row of rows) {
        if (row.last_used > keep.last_used) keep = row;
      }
      for (const row of rows) {
        if (row !== keep) deleteAisle.run(row.normalized_name, shopId);
      }
      repointAisle.run(targetNorm, keep.normalized_name, shopId);
    }

    // 4) aliases — source names become aliases of the target, and any alias
    // whose canonical was a source is re-pointed.
    for (const display of sourceDisplay.values()) {
      saveIngredientAlias(display, targetName, dbConn);
    }
    const aliasRows = dbConn
      .prepare(
        "SELECT normalized_alias, canonical_name FROM groceries_ingredient_aliases",
      )
      .all() as AliasRow[];
    const repointAlias = dbConn.prepare(
      "UPDATE groceries_ingredient_aliases SET canonical_name = ?, updated_at = unixepoch() WHERE normalized_alias = ?",
    );
    for (const row of aliasRows) {
      if (sourceSet.has(normalizeProductName(row.canonical_name))) {
        repointAlias.run(targetName, row.normalized_alias);
      }
    }

    // 5) current list items — rename only (amount/unit untouched).
    const itemRows = dbConn
      .prepare("SELECT id, name FROM groceries_items")
      .all() as ItemRow[];
    const renameItem = dbConn.prepare(
      "UPDATE groceries_items SET name = ? WHERE id = ?",
    );
    for (const row of itemRows) {
      if (sourceSet.has(normalizeProductName(row.name))) {
        renameItem.run(targetName, row.id);
      }
    }
  });

  run();
  return { merged: sources.length, target: targetName };
}
