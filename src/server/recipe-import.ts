import Database from "better-sqlite3";
import { extractIngredients, type ExtractedIngredient, type Unit } from "./llm.ts";
import { getDb } from "../db/connection.ts";
import { createGroceryItem, getGroceryItems } from "../db/groceries.ts";
import { getActiveShop, getInventoryWindowDays } from "../db/settings.ts";
import { setItemAisle, saveProductAisle, getSuggestedAisle } from "../db/shops.ts";
import {
  findProductMatches,
  getRecentlyBought,
  resolveCanonical,
  saveIngredientAlias,
} from "../db/groceries-import.ts";
import { normalizeProductName } from "../utils/groceries.ts";

export const VALID_UNITS: ReadonlySet<string> = new Set(["x", "g", "kg", "l", "ml"]);
const DESCRIPTION_LIMIT = 300;

export type MatchType = "existing" | "new" | "possible";

export interface DraftMatch {
  type: MatchType;
  name: string | null;
  confidence: number;
}

export interface DraftInventory {
  boughtAt: number;
  daysAgo: number;
}

export interface DraftItem {
  name: string;
  amount: number;
  unit: Unit;
  description: string;
  match: DraftMatch;
  inventory: DraftInventory | null;
  sourceName: string;
}

export interface ParseIngredientsOptions {
  db?: Database.Database;
  windowDays?: number;
  extract?: (ocrText: string) => Promise<ExtractedIngredient[]>;
}

const BASE_UNITS: Record<Unit, { unit: Unit; factor: number }> = {
  x: { unit: "x", factor: 1 },
  g: { unit: "g", factor: 1 },
  kg: { unit: "g", factor: 1000 },
  l: { unit: "ml", factor: 1 },
  ml: { unit: "ml", factor: 1 },
};

interface WorkingItem {
  name: string;
  amount: number;
  unit: Unit;
  description: string;
  sourceName: string;
}

function toWorkingItem(ingredient: ExtractedIngredient, db?: Database.Database): WorkingItem {
  const rawName = ingredient.name.trim();
  const canonical =
    resolveCanonical(normalizeProductName(rawName), db) ?? rawName;
  const hasAmount =
    typeof ingredient.amount === "number" &&
    Number.isFinite(ingredient.amount) &&
    ingredient.amount > 0;
  const unit =
    hasAmount && ingredient.unit && VALID_UNITS.has(ingredient.unit)
      ? ingredient.unit
      : "x";
  return {
    name: canonical,
    amount: hasAmount ? (ingredient.amount as number) : 1,
    unit,
    description: (ingredient.description ?? "").slice(0, DESCRIPTION_LIMIT),
    sourceName: rawName,
  };
}

function mergeItems(items: WorkingItem[]): WorkingItem[] {
  const groups = new Map<string, WorkingItem[]>();
  for (const item of items) {
    const key = normalizeProductName(item.name);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  const merged: WorkingItem[] = [];
  for (const group of groups.values()) {
    const units = new Set(group.map((item) => item.unit));
    const sameUnit = units.size === 1;
    const base = BASE_UNITS[group[0].unit];

    const amount = sameUnit
      ? group.reduce((sum, item) => sum + item.amount, 0)
      : group.reduce((sum, item) => sum + item.amount * BASE_UNITS[item.unit].factor, 0);

    const descriptions = [...new Set(group.map((item) => item.description).filter(Boolean))];
    merged.push({
      name: group[0].name,
      amount: Math.round(amount * 1000) / 1000,
      unit: sameUnit ? group[0].unit : base.unit,
      description: descriptions.join("; ").slice(0, DESCRIPTION_LIMIT),
      sourceName: group[0].sourceName,
    });
  }
  return merged;
}

export async function parseIngredients(
  ocrText: string,
  options: ParseIngredientsOptions = {},
): Promise<DraftItem[]> {
  const db = options.db;
  const extract = options.extract ?? ((text: string) => extractIngredients(text));
  const windowDays = options.windowDays ?? getInventoryWindowDays("default", db);

  const extracted = await extract(ocrText);
  const merged = mergeItems(extracted.map((item) => toWorkingItem(item, db)));
  if (merged.length === 0) return [];

  const currentNames = new Map<string, string>();
  for (const item of getGroceryItems(db)) {
    currentNames.set(normalizeProductName(item.name), item.name);
  }

  const recent = getRecentlyBought(
    merged.map((item) => item.name),
    windowDays,
    db,
  );
  const nowSeconds = Math.floor(Date.now() / 1000);

  return merged.map((item) => {
    const normalized = normalizeProductName(item.name);
    const existingName = currentNames.get(normalized);

    let match: DraftMatch;
    if (existingName) {
      match = { type: "existing", name: existingName, confidence: 1 };
    } else {
      const matches = findProductMatches(item.name, db);
      match = matches.length
        ? { type: "possible", name: matches[0].name, confidence: matches[0].confidence }
        : { type: "new", name: null, confidence: 0 };
    }

    const boughtAt = recent.get(normalized);
    const inventory =
      boughtAt !== undefined
        ? { boughtAt, daysAgo: Math.max(0, Math.round((nowSeconds - boughtAt) / 86400)) }
        : null;

    return {
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      description: item.description,
      match,
      inventory,
      sourceName: item.sourceName,
    };
  });
}

export interface ConfirmItemInput {
  name: string;
  amount: number;
  unit: Unit;
  description?: string;
  aisleId?: number | null;
  sourceName?: string;
}

export interface ConfirmImportOptions {
  db?: Database.Database;
  shopId?: number | null;
}

export interface ConfirmImportResult {
  created: number[];
}

export function confirmImport(
  items: ConfirmItemInput[],
  options: ConfirmImportOptions = {},
): ConfirmImportResult {
  const db = options.db ?? getDb();
  const shopId = options.shopId !== undefined ? options.shopId : getActiveShop("default", db);
  const created: number[] = [];

  const run = db.transaction(() => {
    for (const item of items) {
      const id = createGroceryItem(
        item.name,
        item.description?.trim() || null,
        false,
        item.amount,
        item.unit,
        db,
      );
      created.push(id);

      if (shopId !== null) {
        if (item.aisleId === undefined) {
          const suggested = getSuggestedAisle(item.name, shopId, db);
          if (suggested !== null) {
            setItemAisle(id, shopId, suggested, db);
            saveProductAisle(item.name, shopId, suggested, false, db);
          }
        } else if (item.aisleId !== null) {
          setItemAisle(id, shopId, item.aisleId, db);
          saveProductAisle(item.name, shopId, item.aisleId, true, db);
        }
      }

      if (item.sourceName) {
        const source = normalizeProductName(item.sourceName);
        if (source && source !== normalizeProductName(item.name)) {
          saveIngredientAlias(item.sourceName, item.name, db);
        }
      }
    }
  });
  run();

  return { created };
}
