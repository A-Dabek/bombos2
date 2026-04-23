import type { RequestHandler } from "@builder.io/qwik-city";
import { completeParcel } from "../../../../../db/parcels.ts";

export const onPost: RequestHandler = async ({ params, json }) => {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    json(400, { error: "Invalid parcel ID" });
    return;
  }

  const success = completeParcel(id);
  if (!success) {
    json(404, { error: "Parcel not found or already completed" });
    return;
  }

  json(200, { success: true });
};
