import type { RequestHandler } from "@builder.io/qwik-city";
import { getParcels, createParcel } from "~/db/parcels";

export function createParcelHandlers(type: "incoming" | "outgoing") {
  const onGet: RequestHandler = async ({ json }) => {
    const rows = getParcels(type);
    const parcels = rows.map((row) => ({
      id: row.id,
      type: row.type,
      imageBase64: Buffer.from(row.image).toString("base64"),
      contentType: row.content_type,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      note: row.note,
    }));
    json(200, parcels);
  };

  const onPost: RequestHandler = async ({ request, json }) => {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      json(400, { error: "Missing image file" });
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const id = createParcel(type, bytes, file.type);
    json(201, { id });
  };

  return { onGet, onPost };
}
