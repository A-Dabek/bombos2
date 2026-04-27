import type { RequestHandler } from "@builder.io/qwik-city";
import { getPlanListById, deleteAllPlanItems } from "~/db/plan";

export const onDelete: RequestHandler = async ({ params, json }) => {
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

  const count = deleteAllPlanItems(listId);
  json(200, { deleted: count });
};