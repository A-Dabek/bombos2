import type { RequestHandler } from "@builder.io/qwik-city";
import { getGroceryItems, createGroceryItem, deleteAllGroceryItems, deleteBoughtGroceryItems } from "~/db/groceries";

export const onGet: RequestHandler = async ({ json }) => {
  const items = getGroceryItems();
  json(200, items);
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const body = await parseBody();
  const name = (body as { name?: string })?.name;
  const description = (body as { description?: string })?.description;
  const urgent = (body as { urgent?: boolean })?.urgent;
  const amount = (body as { amount?: number })?.amount ?? 1.0;
  const unit = (body as { unit?: string })?.unit ?? "x";
  const category = (body as { category?: string })?.category;

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

  if (category && category.length > 50) {
    json(400, { error: "Category must be 50 characters or less" });
    return;
  }

  const id = createGroceryItem(name.trim(), description || null, !!urgent, amount, unit, category?.trim() || null);
  json(201, { id });
};

export const onDelete: RequestHandler = async ({ json, url }) => {
  const boughtOnly = url.searchParams.get("bought") === "true";
  const count = boughtOnly ? deleteBoughtGroceryItems() : deleteAllGroceryItems();
  json(200, { deleted: count });
};
