import type { RequestHandler } from "@builder.io/qwik-city";
import { getShopById, updateShop, deleteShop } from "~/db/shops";

export const onGet: RequestHandler = async ({ params, json }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid shop ID" });
    return;
  }

  const shop = getShopById(id);
  if (!shop) {
    json(404, { error: "Shop not found" });
    return;
  }

  json(200, shop);
};

export const onPatch: RequestHandler = async ({ params, json, parseBody }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid shop ID" });
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

  const updated = updateShop(id, name.trim());
  if (!updated) {
    json(404, { error: "Shop not found" });
    return;
  }

  json(200, { success: true });
};

export const onDelete: RequestHandler = async ({ params, json }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid shop ID" });
    return;
  }

  const result = deleteShop(id);
  if (!result.ok) {
    if (result.reason === "not_found") {
      json(404, { error: "Shop not found" });
    } else {
      json(400, { error: "Cannot delete the last shop" });
    }
    return;
  }

  json(200, { success: true });
};
