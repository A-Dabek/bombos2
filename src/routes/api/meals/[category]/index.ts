import type { RequestHandler } from "@builder.io/qwik-city";
import { getMealsByCategory, createMeal } from "~/db/meals";

export const onGet: RequestHandler = async ({ params, json }) => {
  const category = params.category;

  if (category !== "dinner" && category !== "supper") {
    json(400, { error: "Invalid category" });
    return;
  }

  const meals = getMealsByCategory(category);
  json(200, meals);
};

export const onPost: RequestHandler = async ({ params, json, parseBody }) => {
  const category = params.category;

  if (category !== "dinner" && category !== "supper") {
    json(400, { error: "Invalid category" });
    return;
  }

  const body = await parseBody();
  const name = (body as { name?: string })?.name;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    json(400, { error: "Name is required" });
    return;
  }

  const id = createMeal(category, name.trim());
  json(201, { id });
};