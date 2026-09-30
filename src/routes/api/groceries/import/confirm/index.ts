import type { RequestHandler } from "@builder.io/qwik-city";
import {
  confirmImport,
  VALID_UNITS,
  type ConfirmItemInput,
} from "~/server/recipe-import";
import type { Unit } from "~/server/llm";
import { getActiveShop } from "~/db/settings";

const MAX_ITEMS = 100;

function resolveShopId(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  return getActiveShop();
}

export const onPost: RequestHandler = async ({ parseBody, json }) => {
  let body: { items?: unknown; shopId?: unknown };
  try {
    body = (await parseBody()) as { items?: unknown; shopId?: unknown };
  } catch {
    json(400, { error: "Expected a JSON body" });
    return;
  }

  const rawItems = body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    json(400, { error: "items must be a non-empty array" });
    return;
  }
  if (rawItems.length > MAX_ITEMS) {
    json(400, { error: `items must contain at most ${MAX_ITEMS} entries` });
    return;
  }

  const items: ConfirmItemInput[] = [];
  for (let index = 0; index < rawItems.length; index++) {
    const item = (rawItems[index] ?? {}) as Record<string, unknown>;

    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) {
      json(400, { error: `items[${index}].name is required` });
      return;
    }
    if (name.length > 100) {
      json(400, { error: `items[${index}].name must be 100 characters or less` });
      return;
    }

    const description = typeof item.description === "string" ? item.description.trim() : "";
    if (description.length > 300) {
      json(400, { error: `items[${index}].description must be 300 characters or less` });
      return;
    }

    const amount =
      typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount > 0
        ? item.amount
        : 1;
    const unit: Unit =
      typeof item.unit === "string" && VALID_UNITS.has(item.unit) ? (item.unit as Unit) : "x";

    let aisleId: number | null | undefined = undefined;
    if (item.aisleId !== undefined && item.aisleId !== null) {
      if (!Number.isInteger(item.aisleId)) {
        json(400, { error: `items[${index}].aisleId must be an integer or null` });
        return;
      }
      aisleId = item.aisleId as number;
    } else if (item.aisleId === null) {
      aisleId = null;
    }

    const sourceName =
      typeof item.sourceName === "string" && item.sourceName.trim()
        ? item.sourceName.trim()
        : undefined;

    items.push({ name, amount, unit, description: description || undefined, aisleId, sourceName });
  }

  const { created } = confirmImport(items, { shopId: resolveShopId(body?.shopId) });
  json(201, { created });
};
