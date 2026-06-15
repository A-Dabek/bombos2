import type { RequestHandler } from "@builder.io/qwik-city";
import { getCompletedCategories, setCategoryCompleted } from "~/db/groceries";

export const onGet: RequestHandler = async ({ json }) => {
  const categories = getCompletedCategories();
  json(200, categories);
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const body = await parseBody();
  const category = (body as { category?: string })?.category;
  const completed = (body as { completed?: boolean })?.completed;

  if (typeof category !== "string" || category.trim().length === 0) {
    json(400, { error: "Category is required" });
    return;
  }

  setCategoryCompleted(category, !!completed);
  json(200, { success: true });
};
