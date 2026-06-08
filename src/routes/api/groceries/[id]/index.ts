import type { RequestHandler } from "@builder.io/qwik-city";
import { getGroceryItemById, updateGroceryItem, setGroceryItemBought, deleteGroceryItem, updateGroceryItemAmount } from "~/db/groceries";

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

  // If only bought is being updated
  if (bought !== undefined && name === undefined && description === undefined && urgent === undefined && amount === undefined && unit === undefined) {
    setGroceryItemBought(id, bought);
    json(200, { success: true });
    return;
  }

  // If only amount is being updated
  if (amount !== undefined && name === undefined && description === undefined && urgent === undefined && bought === undefined && unit === undefined) {
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
