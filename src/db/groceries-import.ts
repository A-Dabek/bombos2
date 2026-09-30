import Database from "better-sqlite3";
import { getDb } from "./connection.ts";
import { normalizeProductName } from "../utils/groceries.ts";

const CATALOG_PRODUCT_LIMIT = 150;
const MATCH_THRESHOLD = 0.6;
const MATCH_LIMIT = 5;

export interface CatalogEntry {
  name: string;
  normalized: string;
}

export interface ProductMatch {
  name: string;
  confidence: number;
}

export function logPurchase(name: string, db?: Database.Database): void {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  dbConn
    .prepare(
      "INSERT INTO groceries_purchase_log (name, normalized_name) VALUES (?, ?)",
    )
    .run(name, normalized);
}

export function getRecentlyBought(
  keys: string[],
  windowDays: number,
  db?: Database.Database,
): Map<string, number> {
  const dbConn = db ?? getDb();
  const normalizedKeys = [...new Set(keys.map(normalizeProductName).filter(Boolean))];
  const result = new Map<string, number>();
  if (normalizedKeys.length === 0) return result;

  const cutoff = Math.floor(Date.now() / 1000) - Math.max(0, windowDays) * 86400;
  const placeholders = normalizedKeys.map(() => "?").join(", ");
  const rows = dbConn
    .prepare(
      `SELECT normalized_name, MAX(bought_at) AS bought_at
       FROM groceries_purchase_log
       WHERE normalized_name IN (${placeholders}) AND bought_at >= ?
       GROUP BY normalized_name`,
    )
    .all(...normalizedKeys, cutoff) as { normalized_name: string; bought_at: number }[];

  for (const row of rows) result.set(row.normalized_name, row.bought_at);
  return result;
}

export function saveIngredientAlias(
  alias: string,
  canonicalName: string,
  db?: Database.Database,
): void {
  const dbConn = db ?? getDb();
  const normalizedAlias = normalizeProductName(alias);
  if (!normalizedAlias) return;
  dbConn
    .prepare(
      `INSERT INTO groceries_ingredient_aliases (normalized_alias, canonical_name, updated_at)
       VALUES (?, ?, unixepoch())
       ON CONFLICT(normalized_alias) DO UPDATE SET
         canonical_name = excluded.canonical_name,
         updated_at = unixepoch()`,
    )
    .run(normalizedAlias, canonicalName);
}

export function resolveCanonical(
  normalizedAlias: string,
  db?: Database.Database,
): string | null {
  const dbConn = db ?? getDb();
  const row = dbConn
    .prepare(
      "SELECT canonical_name FROM groceries_ingredient_aliases WHERE normalized_alias = ?",
    )
    .get(normalizeProductName(normalizedAlias)) as { canonical_name: string } | undefined;
  return row?.canonical_name ?? null;
}

export function isKnownProduct(name: string, db?: Database.Database): boolean {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  if (!normalized) return false;

  const count = dbConn
    .prepare("SELECT 1 FROM groceries_product_counts WHERE normalized_name = ?")
    .get(normalized);
  if (count) return true;

  const items = dbConn.prepare("SELECT name FROM groceries_items").all() as {
    name: string;
  }[];
  if (items.some((item) => normalizeProductName(item.name) === normalized)) return true;

  const alias = dbConn
    .prepare("SELECT 1 FROM groceries_ingredient_aliases WHERE normalized_alias = ?")
    .get(normalized);
  return Boolean(alias);
}

export function buildCatalog(db?: Database.Database): CatalogEntry[] {
  const dbConn = db ?? getDb();
  const seen = new Set<string>();
  const entries: CatalogEntry[] = [];

  const push = (name: string, normalized?: string) => {
    const norm = normalized ?? normalizeProductName(name);
    if (!norm || seen.has(norm)) return;
    seen.add(norm);
    entries.push({ name, normalized: norm });
  };

  const products = dbConn
    .prepare(
      "SELECT name, normalized_name FROM groceries_product_counts ORDER BY buy_count DESC LIMIT ?",
    )
    .all(CATALOG_PRODUCT_LIMIT) as { name: string; normalized_name: string }[];
  for (const row of products) push(row.name, row.normalized_name);

  const items = dbConn
    .prepare("SELECT DISTINCT name FROM groceries_items ORDER BY name")
    .all() as { name: string }[];
  for (const row of items) push(row.name);

  const aliases = dbConn
    .prepare("SELECT DISTINCT canonical_name FROM groceries_ingredient_aliases")
    .all() as { canonical_name: string }[];
  for (const row of aliases) push(row.canonical_name);

  return entries;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

export function findProductMatches(
  name: string,
  db?: Database.Database,
): ProductMatch[] {
  const dbConn = db ?? getDb();
  const normalized = normalizeProductName(name);
  if (!normalized) return [];

  const best = new Map<string, ProductMatch>();
  const consider = (candidate: string, confidence: number) => {
    if (confidence < MATCH_THRESHOLD) return;
    const key = normalizeProductName(candidate);
    const existing = best.get(key);
    if (!existing || confidence > existing.confidence) {
      best.set(key, { name: candidate, confidence });
    }
  };

  for (const entry of buildCatalog(dbConn)) {
    const confidence =
      entry.normalized === normalized ? 1 : similarity(normalized, entry.normalized);
    consider(entry.name, confidence);
  }

  const canonical = resolveCanonical(normalized, dbConn);
  if (canonical) consider(canonical, 0.95);

  return [...best.values()]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MATCH_LIMIT);
}
