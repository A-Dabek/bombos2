import type { RequestHandler } from "@builder.io/qwik-city";
import { recognizeText } from "~/server/ocr";
import { parseIngredients, type DraftItem } from "~/server/recipe-import";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const STUB_ITEMS: DraftItem[] = [
  {
    name: "cebula",
    amount: 200,
    unit: "g",
    description: "2 duże cebule po 100 g",
    raw: "2duże cebule (po 100 g)",
    match: { type: "new", name: null, confidence: 0 },
    inventory: null,
    sourceName: "cebula",
  },
  {
    name: "jajka",
    amount: 4,
    unit: "x",
    description: "wielkość M",
    raw: "4jajka (wielkość M)",
    match: { type: "new", name: null, confidence: 0 },
    inventory: null,
    sourceName: "jajka",
  },
  {
    name: "śmietana",
    amount: 250,
    unit: "ml",
    description: "schłodzona, 30% tł.",
    raw: "250 ml schłodzonej śmietany (30% tł.)",
    match: { type: "new", name: null, confidence: 0 },
    inventory: null,
    sourceName: "śmietana",
  },
  {
    name: "szczypiorek",
    amount: 1,
    unit: "x",
    description: "% pęczka szczypiorku",
    raw: "% pęczka szczypiorku",
    match: { type: "new", name: null, confidence: 0 },
    inventory: null,
    sourceName: "szczypiorek",
  },
  {
    name: "sól",
    amount: 1,
    unit: "x",
    description: "",
    raw: "| |'sól",
    match: { type: "new", name: null, confidence: 0 },
    inventory: null,
    sourceName: "sól",
  },
];

function isStub(): boolean {
  return process.env.GROCERIES_IMPORT_STUB === "true";
}

export const onPost: RequestHandler = async ({ request, json }) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    json(400, { error: "Expected multipart/form-data" });
    return;
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    json(400, { error: "Missing image file" });
    return;
  }
  if (file.size === 0) {
    json(400, { error: "Image file is empty" });
    return;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    json(413, { error: "Image file is too large (max 10 MB)" });
    return;
  }
  if (file.type && !file.type.startsWith("image/")) {
    json(415, { error: "File must be an image" });
    return;
  }

  if (isStub()) {
    json(200, { items: STUB_ITEMS });
    return;
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const ocr = await recognizeText(buffer);
    const items = await parseIngredients(ocr.text);
    json(200, { items, ocrConfidence: ocr.confidence });
  } catch (error) {
    console.error("recipe import analyze failed:", error instanceof Error ? error.message : error);
    json(502, { error: "Could not process the image. Please try again." });
  }
};
