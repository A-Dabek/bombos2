import type { RequestHandler } from "@builder.io/qwik-city";
import { getCompletedAisles, setAisleCompleted } from "~/db/shops";
import { getActiveShop } from "~/db/settings";

export const onGet: RequestHandler = async ({ json, url }) => {
  const shopParam = url.searchParams.get("shop");
  const parsed = shopParam ? parseInt(shopParam, 10) : NaN;
  const shopId = Number.isNaN(parsed) ? getActiveShop() : parsed;

  if (shopId === null) {
    json(200, []);
    return;
  }

  json(200, getCompletedAisles(shopId));
};

export const onPost: RequestHandler = async ({ json, parseBody }) => {
  const body = await parseBody();
  const shopIdInput = (body as { shopId?: unknown })?.shopId;
  const aisleId = (body as { aisleId?: unknown })?.aisleId;
  const completed = (body as { completed?: boolean })?.completed;

  const shopId =
    typeof shopIdInput === "number" && Number.isInteger(shopIdInput)
      ? shopIdInput
      : getActiveShop();

  if (shopId === null) {
    json(400, { error: "Shop is required" });
    return;
  }

  if (typeof aisleId !== "number" || !Number.isInteger(aisleId)) {
    json(400, { error: "aisleId is required" });
    return;
  }

  setAisleCompleted(shopId, aisleId, !!completed);
  json(200, { success: true });
};
