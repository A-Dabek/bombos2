import { test, expect } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "../db/migrations.ts";
import { createGroceryItem, incrementGroceryItemCount, getGroceryItems } from "../db/groceries.ts";
import {
  logPurchase,
  saveIngredientAlias,
  resolveCanonical,
} from "../db/groceries-import.ts";
import { createShop, createAisle, getItemAisleMap, saveProductAisle } from "../db/shops.ts";
import { extractIngredients, type ExtractedIngredient } from "./llm.ts";
import { parseIngredients, confirmImport } from "./recipe-import.ts";

function freshDb(): Database.Database {
  const db = new Database(":memory:");
  runMigrations(db);
  return db;
}

function fakeExtract(items: ExtractedIngredient[]) {
  return async () => items;
}

test("parseIngredients merges duplicates and defaults missing amounts", async () => {
  const db = freshDb();
  const items = await parseIngredients("ignored", {
    db,
    windowDays: 15,
    extract: fakeExtract([
      { name: "cebula", amount: 200, unit: "g", description: "2 duże cebule po 100 g" },
      { name: "cebula", amount: 300, unit: "g" },
      { name: "jajka", amount: 4, unit: "x" },
      { name: "jajka", amount: 4, unit: "x", description: "wielkość M" },
      { name: "szczypiorek", description: "% pęczka szczypiorku" },
      { name: "mleko", amount: 1, unit: "l" },
    ]),
  });

  const byName = Object.fromEntries(items.map((i) => [i.name, i]));
  expect(items).toHaveLength(4);
  expect(byName["Cebula"]).toMatchObject({ amount: 500, unit: "g" });
  expect(byName["Cebula"].description).toBe("2 duże cebule po 100 g");
  expect(byName["Jajka"]).toMatchObject({ amount: 8, unit: "x", description: "wielkość M" });
  expect(byName["Szczypiorek"]).toMatchObject({ amount: 1, unit: "x" });
  expect(byName["Mleko"]).toMatchObject({ amount: 1, unit: "l" });
  db.close();
});

test("parseIngredients capitalizes the first letter of names", async () => {
  const db = freshDb();
  const items = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([
      { name: "natka pietruszki", amount: 1, unit: "x" },
      { name: "sól", amount: 1, unit: "x" },
    ]),
  });

  const names = items.map((item) => item.name).sort();
  expect(names).toEqual(["Natka pietruszki", "Sól"]);
  db.close();
});

test("parseIngredients converts units when merging g with kg", async () => {
  const db = freshDb();
  const items = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([
      { name: "mąka", amount: 500, unit: "g" },
      { name: "mąka", amount: 1, unit: "kg" },
    ]),
  });

  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ name: "Mąka", amount: 1500, unit: "g" });
  db.close();
});

test("parseIngredients applies ingredient aliases before merging", async () => {
  const db = freshDb();
  saveIngredientAlias("cebule", "cebula", db);

  const items = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([
      { name: "cebule", amount: 100, unit: "g" },
      { name: "cebula", amount: 100, unit: "g" },
    ]),
  });

  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ name: "Cebula", amount: 200, unit: "g" });
  db.close();
});

test("parseIngredients classifies existing, possible and new matches", async () => {
  const db = freshDb();
  createGroceryItem("cebula", null, false, 1, "x", db);
  incrementGroceryItemCount("Marchewka", db);

  const [existing] = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([{ name: "Cebula", amount: 1, unit: "x" }]),
  });
  expect(existing.match).toMatchObject({
    type: "existing",
    name: "cebula",
    confidence: 1,
    amount: 1,
    unit: "x",
  });

  const [possible] = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([{ name: "marchewki", amount: 1, unit: "x" }]),
  });
  expect(possible.match.type).toBe("possible");
  expect(possible.match.name).toBe("Marchewka");

  const [fresh] = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([{ name: "egzotyczny owoc", amount: 1, unit: "x" }]),
  });
  expect(fresh.match).toEqual({ type: "new", name: null, confidence: 0 });
  db.close();
});

test("parseIngredients attaches inventory within the recency window", async () => {
  const db = freshDb();
  logPurchase("Cebula", db);

  const now = Math.floor(Date.now() / 1000);
  db.prepare(
    "INSERT INTO groceries_purchase_log (name, normalized_name, bought_at) VALUES (?, ?, ?)",
  ).run("Chleb", "chleb", now - 40 * 86400);

  const [cebula] = await parseIngredients("ignored", {
    db,
    windowDays: 15,
    extract: fakeExtract([{ name: "cebula", amount: 1, unit: "x" }]),
  });
  expect(cebula.inventory).not.toBeNull();
  expect(cebula.inventory!.daysAgo).toBe(0);

  const [chleb] = await parseIngredients("ignored", {
    db,
    windowDays: 15,
    extract: fakeExtract([{ name: "chleb", amount: 1, unit: "x" }]),
  });
  expect(chleb.inventory).toBeNull();

  const [chlebWide] = await parseIngredients("ignored", {
    db,
    windowDays: 60,
    extract: fakeExtract([{ name: "chleb", amount: 1, unit: "x" }]),
  });
  expect(chlebWide.inventory).not.toBeNull();
  db.close();
});

function fakeFetchQueue(contents: (string | null)[]): typeof fetch {
  let index = 0;
  const impl = async () => {
    const content = contents[Math.min(index, contents.length - 1)];
    index++;
    return new Response(
      JSON.stringify({ choices: [{ message: { content }, finish_reason: "stop" }] }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  return impl as unknown as typeof fetch;
}

test("extractIngredients throws on invalid JSON content", async () => {
  await expect(
    extractIngredients("ocr", {
      apiKey: "test",
      fetchImpl: fakeFetchQueue(["not json"]),
    }),
  ).rejects.toThrow(/not valid JSON/);
});

test("extractIngredients retries once when content is empty", async () => {
  const items = await extractIngredients("ocr", {
    apiKey: "test",
    fetchImpl: fakeFetchQueue(["", JSON.stringify({ items: [{ name: "cebula" }] })]),
  });
  expect(items).toEqual([{ name: "cebula" }]);
});

test("parseIngredients carries raw source text and merges it", async () => {
  const db = freshDb();
  const items = await parseIngredients("ignored", {
    db,
    extract: fakeExtract([
      { name: "cebula", amount: 200, unit: "g", raw: "2duże cebule\n(po 100 g)" },
      { name: "cebula", amount: 100, unit: "g", raw: "cebula\n100 g" },
    ]),
  });

  expect(items).toHaveLength(1);
  expect(items[0].raw).toBe("2duże cebule (po 100 g) | cebula 100 g");
  db.close();
});

test("extractIngredients validates and normalizes LLM items", async () => {
  const items = await extractIngredients("ocr", {
    apiKey: "test",
    fetchImpl: fakeFetchQueue([
      JSON.stringify({
        items: [
          { name: "  Cebula ", amount: 200, unit: "g", description: "x", raw: "Cebula 200 g" },
          { name: "zły", amount: "dużo", unit: "łyżka" },
          { amount: 5 },
          { name: "sól" },
        ],
      }),
    ]),
  });

  expect(items).toEqual([
    { name: "Cebula", amount: 200, unit: "g", description: "x", raw: "Cebula 200 g" },
    { name: "zły" },
    { name: "sól" },
  ]);
});

test("confirmImport creates items", () => {
  const db = freshDb();
  const { created } = confirmImport(
    [
      { name: "cebula", amount: 200, unit: "g" },
      { name: "sól", amount: 1, unit: "x" },
    ],
    { db, shopId: null },
  );

  expect(created).toHaveLength(2);
  expect(getGroceryItems(db).map((item) => item.name)).toEqual(["cebula", "sól"]);
  db.close();
});

test("confirmImport learns aliases only for known products", () => {
  const db = freshDb();
  createGroceryItem("cebula", null, false, 1, "x", db);

  confirmImport(
    [{ name: "cebula", amount: 200, unit: "g", sourceName: "cebule" }],
    { db, shopId: null },
  );

  expect(resolveCanonical("cebule", db)).toBe("cebula");
  db.close();
});

test("confirmImport does not learn aliases for free-form renames", () => {
  const db = freshDb();
  confirmImport(
    [{ name: "cebula edytowana", amount: 1, unit: "x", sourceName: "cebule" }],
    { db, shopId: null },
  );

  expect(resolveCanonical("cebule", db)).toBeNull();
  db.close();
});

test("confirmImport assigns item aisle and remembers the product aisle", () => {
  const db = freshDb();
  const shopId = createShop("Test", db);
  const aisleId = createAisle(shopId, "Warzywa", db);

  const { created } = confirmImport(
    [{ name: "cebula", amount: 1, unit: "x", aisleId }],
    { db, shopId },
  );

  const map = getItemAisleMap(shopId, db);
  expect(map.get(created[0])).toBe(aisleId);
  const row = db
    .prepare(
      "SELECT aisle_id FROM groceries_product_aisles WHERE normalized_name = ? AND shop_id = ?",
    )
    .get("cebula", shopId) as { aisle_id: number } | undefined;
  expect(row?.aisle_id).toBe(aisleId);
  db.close();
});

test("confirmImport auto-resolves aisle from learned product aisles", () => {
  const db = freshDb();
  const shopId = createShop("Test", db);
  const aisleId = createAisle(shopId, "Warzywa", db);
  saveProductAisle("cebula", shopId, aisleId, true, db);

  const { created } = confirmImport([{ name: "cebula", amount: 1, unit: "x" }], {
    db,
    shopId,
  });

  expect(getItemAisleMap(shopId, db).get(created[0])).toBe(aisleId);
  db.close();
});
