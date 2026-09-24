import type { RequestHandler } from "@builder.io/qwik-city";
import {
  getShopById,
  getAisles,
  getAisleItemCounts,
  createAisle,
  reorderAisles,
} from "~/db/shops";

export const onGet: RequestHandler = async ({ params, json }) => {
  const shopId = parseInt(params.id, 10);
  if (isNaN(shopId)) {
    json(400, { error: "Invalid shop ID" });
    return;
  }

  if (!getShopById(shopId)) {
    json(404, { error: "Shop not found" });
    return;
  }

  json(200, {
    aisles: getAisles(shopId),
    counts: getAisleItemCounts(shopId),
  });
};

export const onPost: RequestHandler = async ({ params, json, parseBody }) => {
  const shopId = parseInt(params.id, 10);
  if (isNaN(shopId)) {
    json(400, { error: "Invalid shop ID" });
    return;
  }

  if (!getShopById(shopId)) {
    json(404, { error: "Shop not found" });
    return;
  }

  const body = await parseBody();
  const name = (body as { name?: string })?.name;

  if (typeof name !== "string" || name.trim().length === 0) {
    json(400, { error: "Name is required" });
    return;
  }

  if (name.trim().length > 50) {
    json(400, { error: "Name must be 50 characters or less" });
    return;
  }

  const id = createAisle(shopId, name.trim());
  json(201, { id });
};

export const onPatch: RequestHandler = async ({ params, json, parseBody }) => {
  const shopId = parseInt(params.id, 10);
  if (isNaN(shopId)) {
    json(400, { error: "Invalid shop ID" });
    return;
  }

  if (!getShopById(shopId)) {
    json(404, { error: "Shop not found" });
    return;
  }

  const body = await parseBody();
  const orderedIds = (body as { orderedIds?: unknown })?.orderedIds;

  if (
    !Array.isArray(orderedIds) ||
    !orderedIds.every((id) => typeof id === "number" && Number.isInteger(id))
  ) {
    json(400, { error: "orderedIds must be an array of integers" });
    return;
  }

  reorderAisles(shopId, orderedIds as number[]);
  json(200, { aisles: getAisles(shopId) });
};
