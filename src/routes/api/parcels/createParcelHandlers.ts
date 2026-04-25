import type { RequestHandler } from "@builder.io/qwik-city";
import sharp from "sharp";
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

    const raw = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(raw)
      .resize(800, 800, { fit: "inside" })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    const id = createParcel(type, new Uint8Array(compressed), "image/png");
    json(201, { id });
  };

  return { onGet, onPost };
}
