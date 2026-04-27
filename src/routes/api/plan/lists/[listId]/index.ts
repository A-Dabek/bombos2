import type { RequestHandler } from "@builder.io/qwik-city";
import { getPlanListById, getPlanItems, createPlanItem } from "~/db/plan";

export const onGet: RequestHandler = async ({ params, json, headers }) => {
  headers.set("Cache-Control", "no-cache");
  
  const listId = parseInt(params.listId, 10);
  if (isNaN(listId)) {
    json(400, { error: "Invalid list ID" });
    return;
  }

  const list = getPlanListById(listId);
  if (!list) {
    json(404, { error: "List not found" });
    return;
  }

  const items = getPlanItems(listId);
  json(200, { list, items });
};

export const onPost: RequestHandler = async ({ params, json, parseBody }) => {
  const listId = parseInt(params.listId, 10);
  if (isNaN(listId)) {
    json(400, { error: "Invalid list ID" });
    return;
  }

  const list = getPlanListById(listId);
  if (!list) {
    json(404, { error: "List not found" });
    return;
  }

  const body = await parseBody();
  const name = (body as { name?: string })?.name;
  const description = (body as { description?: string })?.description ?? null;
  const amount = (body as { amount?: number })?.amount ?? 1;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
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

  if (typeof amount !== "number" || amount < 1) {
    json(400, { error: "Amount must be at least 1" });
    return;
  }

  const id = createPlanItem(listId, name.trim(), description, amount);
  json(201, { id });
};