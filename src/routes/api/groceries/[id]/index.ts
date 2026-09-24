import type { RequestHandler } from "@builder.io/qwik-city";
import {
  getGroceryItemById,
  updateGroceryItem,
  setGroceryItemBought,
  deleteGroceryItem,
  updateGroceryItemAmount,
} from "~/db/groceries";
import { getActiveShop } from "~/db/settings";
import { setItemAisle, clearItemAisle, saveProductAisle } from "~/db/shops";

export const onPatch: RequestHandler = async ({ params, json, parseBody }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid item ID" });
    return;
  }

  const item = getGroceryItemById(id);
  if (!item) {
    json(404, { error: "Item not found" });
    return;
  }

  const body = await parseBody();
  const name = (body as { name?: string })?.name;
  const description = (body as { description?: string })?.description;
  const urgent = (body as { urgent?: boolean })?.urgent;
  const bought = (body as { bought?: boolean })?.bought;
  const amount = (body as { amount?: number })?.amount;
  const unit = (body as { unit?: string })?.unit;
  const shopIdInput = (body as { shopId?: unknown })?.shopId;
  const hasAisle = Object.prototype.hasOwnProperty.call(body, "aisleId");
  const aisleId = (body as { aisleId?: number | null })?.aisleId;
  const aisleManual = (body as { aisleManual?: boolean })?.aisleManual;

  if (hasAisle && aisleId !== null && !Number.isInteger(aisleId)) {
    json(400, { error: "aisleId must be an integer or null" });
    return;
  }

  const noOtherFields =
    name === undefined &&
    description === undefined &&
    urgent === undefined &&
    unit === undefined &&
    !hasAisle;

  // If only bought is being updated
  if (bought !== undefined && amount === undefined && noOtherFields) {
    setGroceryItemBought(id, bought);
    json(200, { success: true });
    return;
  }

  // If only amount is being updated
  if (amount !== undefined && bought === undefined && noOtherFields) {
    updateGroceryItemAmount(id, amount);
    json(200, { success: true });
    return;
  }

  const newName = name !== undefined ? name : item.name;
  const newDescription = description !== undefined ? description : item.description;
  const newUrgent = urgent !== undefined ? urgent : item.urgent;
  const newAmount = amount !== undefined ? amount : item.amount;
  const newUnit = unit !== undefined ? unit : item.unit;

  if (typeof newName !== "string" || newName.trim().length === 0) {
    json(400, { error: "Name is required" });
    return;
  }

  if (newName.trim().length > 100) {
    json(400, { error: "Name must be 100 characters or less" });
    return;
  }

  if (newDescription && newDescription.length > 300) {
    json(400, { error: "Description must be 300 characters or less" });
    return;
  }

  updateGroceryItem(id, newName.trim(), newDescription ?? null, newUrgent, newAmount, newUnit);

  if (bought !== undefined) {
    setGroceryItemBought(id, bought);
  }

  if (hasAisle) {
    const shopId =
      typeof shopIdInput === "number" && Number.isInteger(shopIdInput)
        ? shopIdInput
        : getActiveShop();
    if (shopId !== null) {
      if (aisleId === null) {
        clearItemAisle(id, shopId);
      } else if (typeof aisleId === "number") {
        setItemAisle(id, shopId, aisleId);
        saveProductAisle(newName.trim(), shopId, aisleId, !!aisleManual);
      }
    }
  }

  json(200, { success: true });
};

export const onDelete: RequestHandler = async ({ params, json }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid item ID" });
    return;
  }

  const deleted = deleteGroceryItem(id);
  if (!deleted) {
    json(404, { error: "Item not found" });
    return;
  }

  json(200, { success: true });
};
