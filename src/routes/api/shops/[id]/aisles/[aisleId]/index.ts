import type { RequestHandler } from "@builder.io/qwik-city";
import { getShopById, getAisleById, updateAisle, deleteAisle } from "~/db/shops";

export const onPatch: RequestHandler = async ({ params, json, parseBody }) => {
  const shopId = parseInt(params.id, 10);
  const aisleId = parseInt(params.aisleId, 10);
  if (isNaN(shopId) || isNaN(aisleId)) {
    json(400, { error: "Invalid ID" });
    return;
  }

  const aisle = getAisleById(aisleId);
  if (!aisle || aisle.shop_id !== shopId) {
    json(404, { error: "Aisle not found" });
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

  updateAisle(aisleId, name.trim());
  json(200, { success: true });
};

export const onDelete: RequestHandler = async ({ params, json }) => {
  const shopId = parseInt(params.id, 10);
  const aisleId = parseInt(params.aisleId, 10);
  if (isNaN(shopId) || isNaN(aisleId)) {
    json(400, { error: "Invalid ID" });
    return;
  }

  if (!getShopById(shopId)) {
    json(404, { error: "Shop not found" });
    return;
  }

  const aisle = getAisleById(aisleId);
  if (!aisle || aisle.shop_id !== shopId) {
    json(404, { error: "Aisle not found" });
    return;
  }

  deleteAisle(aisleId);
  json(200, { success: true });
};
