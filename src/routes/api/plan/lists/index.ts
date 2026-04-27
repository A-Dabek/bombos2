import type { RequestHandler } from "@builder.io/qwik-city";
import { getPlanLists, createPlanList, getPlanItems } from "~/db/plan";

export const onGet: RequestHandler = async ({ json }) => {
  const lists = getPlanLists();
  json(200, lists);
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const body = await parseBody();
  const { title, display_order } = body as { title?: string; display_order?: number };

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    json(400, { error: "Title is required" });
    return;
  }

  if (typeof display_order !== "number") {
    json(400, { error: "Display order is required" });
    return;
  }

  const id = createPlanList(title.trim(), display_order);
  json(201, { id });
};