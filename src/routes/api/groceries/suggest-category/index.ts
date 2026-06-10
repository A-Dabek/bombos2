import type { RequestHandler } from "@builder.io/qwik-city";
import { getSuggestedCategory } from "~/db/groceries";

export const onGet: RequestHandler = async ({ json, query }) => {
  const name = query.get("name");
  if (!name) {
    json(400, { error: "Name is required" });
    return;
  }
  const category = getSuggestedCategory(name);
  json(200, { category });
};
