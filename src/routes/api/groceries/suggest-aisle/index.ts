import type { RequestHandler } from "@builder.io/qwik-city";
import { getSuggestedAisle } from "~/db/shops";
import { getActiveShop } from "~/db/settings";

export const onGet: RequestHandler = async ({ json, query }) => {
  const name = query.get("name");
  if (!name) {
    json(400, { error: "Name is required" });
    return;
  }

  const shopParam = query.get("shop");
  const parsed = shopParam ? parseInt(shopParam, 10) : NaN;
  const shopId = Number.isNaN(parsed) ? getActiveShop() : parsed;

  if (shopId === null) {
    json(200, { aisleId: null });
    return;
  }

  json(200, { aisleId: getSuggestedAisle(name, shopId) });
};
