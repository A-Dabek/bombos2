import sharp from "sharp";
import { createWorker, OEM, PSM } from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
}

const LANG_PATH = process.env.TESSDATA_PATH;

export async function recognizeText(input: Buffer): Promise<OcrResult> {
  const meta = await sharp(input).metadata();
  const width = Math.max(1, Math.round((meta.width ?? 1) * 2));

  const pre = await sharp(input)
    .grayscale()
    .normalize()
    .resize({ width, kernel: "lanczos3" })
    .png()
    .toBuffer();

  const worker = await createWorker("pol", OEM.LSTM_ONLY, {
    cacheMethod: "none",
    gzip: !LANG_PATH,
    ...(LANG_PATH ? { langPath: LANG_PATH } : {}),
  });

  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data } = await worker.recognize(pre);
    return { text: data.text, confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
}
