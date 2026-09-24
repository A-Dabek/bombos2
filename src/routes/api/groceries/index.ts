import type { RequestHandler } from "@builder.io/qwik-city";
import {
  getGroceryItems,
  createGroceryItem,
  deleteAllGroceryItems,
  deleteBoughtGroceryItems,
} from "~/db/groceries";
import { getActiveShop } from "~/db/settings";
import { getItemAisleMap, setItemAisle, clearItemAisle, saveProductAisle } from "~/db/shops";

function resolveShopId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  return getActiveShop();
}

export const onGet: RequestHandler = async ({ json, url }) => {
  const shopParam = url.searchParams.get("shop");
  const parsed = shopParam ? parseInt(shopParam, 10) : NaN;
  const shopId = Number.isNaN(parsed) ? getActiveShop() : parsed;
  const items = getGroceryItems();

  if (shopId === null) {
    json(200, items.map((item) => ({ ...item, aisleId: null })));
    return;
  }

  const map = getItemAisleMap(shopId);
  json(
    200,
    items.map((item) => ({ ...item, aisleId: map.get(item.id) ?? null })),
  );
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const body = await parseBody();
  const name = (body as { name?: string })?.name;
  const description = (body as { description?: string })?.description;
  const urgent = (body as { urgent?: boolean })?.urgent;
  const amount = (body as { amount?: number })?.amount ?? 1.0;
  const unit = (body as { unit?: string })?.unit ?? "x";
  const shopIdInput = (body as { shopId?: unknown })?.shopId;
  const aisleId = (body as { aisleId?: number | null })?.aisleId;
  const aisleManual = (body as { aisleManual?: boolean })?.aisleManual;

  if (typeof name !== "string" || name.trim().length === 0) {
    json(400, { error: "Name is required" });
    return;
  }

  if (name.trim().length > 100) {
    json(400, { error: "Name must be 100 characters or less" });
    return;
  }

  if (description && description.length > 300) {
    json(400, { error: "Description must be 300 characters or less" });
    return;
  }

  if (aisleId !== undefined && aisleId !== null && !Number.isInteger(aisleId)) {
    json(400, { error: "aisleId must be an integer or null" });
    return;
  }

  const trimmedName = name.trim();
  const id = createGroceryItem(
    trimmedName,
    description || null,
    !!urgent,
    amount,
    unit,
  );

  const shopId = resolveShopId(shopIdInput);
  if (shopId !== null && aisleId !== undefined) {
    if (aisleId === null) {
      clearItemAisle(id, shopId);
    } else {
      setItemAisle(id, shopId, aisleId);
      saveProductAisle(trimmedName, shopId, aisleId, !!aisleManual);
    }
  }

  json(201, { id });
};

export const onDelete: RequestHandler = async ({ json, url }) => {
  const boughtOnly = url.searchParams.get("bought") === "true";
  const count = boughtOnly ? deleteBoughtGroceryItems() : deleteAllGroceryItems();
  json(200, { deleted: count });
};
