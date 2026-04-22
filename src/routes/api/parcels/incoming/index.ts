import type { RequestHandler } from "@builder.io/qwik-city";
import { getParcels, createParcel } from "../../../../db/parcels.ts";

export const onGet: RequestHandler = async ({ json }) => {
  const rows = getParcels("incoming");
  const parcels = rows.map((row) => ({
    id: row.id,
    type: row.type,
    imageBase64: Buffer.from(row.image).toString("base64"),
    contentType: row.content_type,
    createdAt: row.created_at,
  }));
  json(200, parcels);
};

export const onPost: RequestHandler = async ({ request, json }) => {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    json(400, { error: "Missing image file" });
    return;
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const id = createParcel("incoming", bytes, file.type);
  json(201, { id });
};
