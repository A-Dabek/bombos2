import type { RequestHandler } from "@builder.io/qwik-city";
import { updateParcelNote } from "../../../../../db/parcels.ts";

export const onPost: RequestHandler = async ({ params, request, json }) => {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    json(400, { error: "Invalid parcel ID" });
    return;
  }

  const body = await request.json();
  if (typeof body.note !== "string") {
    json(400, { error: "Missing note field" });
    return;
  }

  if (body.note.length > 100) {
    json(400, { error: "Note exceeds max length of 100 characters" });
    return;
  }

  const success = updateParcelNote(id, body.note);
  if (!success) {
    json(404, { error: "Parcel not found" });
    return;
  }

  json(200, { success: true });
};
