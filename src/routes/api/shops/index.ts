import type { RequestHandler } from "@builder.io/qwik-city";
import { getShops, createShop } from "~/db/shops";

export const onGet: RequestHandler = async ({ json }) => {
  json(200, getShops());
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const body = await parseBody();
  const name = (body as { name?: string })?.name;

  if (typeof name !== "string" || name.trim().length === 0) {
    json(400, { error: "Name is required" });
    return;
  }

  if (name.trim().length > 50) {
    json(400, { error: "Name must be 50 characters or less" });
    return;
  }

  const id = createShop(name.trim());
  json(201, { id });
};
