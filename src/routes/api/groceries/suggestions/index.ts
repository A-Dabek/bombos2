import type { RequestHandler } from "@builder.io/qwik-city";
import { getTopGrocerySuggestions } from "~/db/groceries";

export const onGet: RequestHandler = async ({ json, url }) => {
  const limitStr = url.searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 10;
  
  const suggestions = getTopGrocerySuggestions(isNaN(limit) ? 10 : limit);
  json(200, suggestions);
};
