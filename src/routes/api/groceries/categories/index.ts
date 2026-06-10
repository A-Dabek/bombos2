import type { RequestHandler } from "@builder.io/qwik-city";
import { getAllCategories } from "~/db/groceries";

export const onGet: RequestHandler = async ({ json }) => {
  const categories = getAllCategories();
  json(200, categories);
};
