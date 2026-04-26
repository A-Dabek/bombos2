import type { RequestHandler } from "@builder.io/qwik-city";
import { getMealsByCategory } from "~/db/meals";

export const onGet: RequestHandler = async ({ params, json }) => {
  const category = params.category;

  if (
    category !== "breakfast" &&
    category !== "dinner" &&
    category !== "supper"
  ) {
    json(400, { error: "Invalid category" });
    return;
  }

  const meals = getMealsByCategory(category);
  json(200, meals);
};