import type { RequestHandler } from "@builder.io/qwik-city";
import { getPlanListById, getPlanLists, updatePlanListOrder, deletePlanList, getPlanItems, createPlanItem, getDb } from "~/db/plan";

// GET /api/plan/lists/:id - get a specific list with its items
export const onGet: RequestHandler = async ({ params, json }) => {
  const listId = parseInt(params.id, 10);
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

// POST /api/plan/lists/:id/items - create item in a list
export const onPost: RequestHandler = async ({ params, json, parseBody }) => {
  const listId = parseInt(params.id, 10);
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
  const urgent = (body as { urgent?: boolean })?.urgent ?? false;

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

  const id = createPlanItem(listId, name.trim(), description, urgent);
  json(201, { id });
};

// PATCH /api/plan/lists/:id/order - update list order
export const onPatch: RequestHandler = async ({ params, json, parseBody }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid list ID" });
    return;
  }

  const list = getPlanListById(id);
  if (!list) {
    json(404, { error: "List not found" });
    return;
  }

  const body = await parseBody();
  const direction = (body as { direction?: string })?.direction;

  if (direction !== "up" && direction !== "down") {
    json(400, { error: "Direction must be 'up' or 'down'" });
    return;
  }

  const lists = getPlanLists();
  const currentIndex = lists.findIndex((l) => l.id === id);

  const db = getDb();
  try {
    db.exec("BEGIN TRANSACTION");
    if (direction === "up" && currentIndex > 0) {
      const prevList = lists[currentIndex - 1];
      updatePlanListOrder(id, prevList.display_order, db);
      updatePlanListOrder(prevList.id, list.display_order, db);
    } else if (direction === "down" && currentIndex < lists.length - 1) {
      const nextList = lists[currentIndex + 1];
      updatePlanListOrder(id, nextList.display_order, db);
      updatePlanListOrder(nextList.id, list.display_order, db);
    }
    db.exec("COMMIT");
  } catch (e) {
    db.exec("ROLLBACK");
    json(500, { error: "Failed to reorder lists" });
    return;
  }

  json(200, { success: true });
};

// DELETE /api/plan/lists/:id - delete a list
export const onDelete: RequestHandler = async ({ params, json }) => {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    json(400, { error: "Invalid list ID" });
    return;
  }

  const list = getPlanListById(id);
  if (!list) {
    json(404, { error: "List not found" });
    return;
  }

  deletePlanList(id);
  json(200, { success: true });
};