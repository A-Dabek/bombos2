import sharp from "sharp";
import { createWorker, OEM, PSM } from "tesseract.js";
import { resolveOcrOptions, stripSpuriousUnit9 } from "./ocr-options.ts";

export interface OcrResult {
  text: string;
  confidence: number;
}

const LANG_PATH = process.env.TESSDATA_PATH;

const PSM_BY_NAME: Record<string, PSM> = {
  "3": PSM.AUTO,
  "4": PSM.SINGLE_COLUMN,
  "6": PSM.SINGLE_BLOCK,
  "7": PSM.SINGLE_LINE,
  "11": PSM.SPARSE_TEXT,
};

export async function recognizeText(input: Buffer): Promise<OcrResult> {
  const opts = resolveOcrOptions();
  const meta = await sharp(input).metadata();
  const width = Math.min(
    opts.maxWidth,
    Math.max(1, Math.round((meta.width ?? 1) * opts.scale)),
  );

  const base = sharp(input).grayscale();
  const { channels } = await base.clone().stats();
  const lightOnDark = (channels[0]?.mean ?? 255) < 128;

  let pipeline = lightOnDark ? base.clone().negate() : base;
  pipeline = pipeline.normalize().resize({ width, kernel: "lanczos3" });
  if (opts.binarize) pipeline = pipeline.threshold(180);

  const pre = await pipeline.png().toBuffer();

  const worker = await createWorker("pol", OEM.LSTM_ONLY, {
    cacheMethod: "none",
    gzip: !LANG_PATH,
    ...(LANG_PATH ? { langPath: LANG_PATH } : {}),
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM_BY_NAME[opts.psm] ?? PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
      user_defined_dpi: "300",
    });
    const { data } = await worker.recognize(pre);
    const text = opts.stripSpuriousUnit9 ? stripSpuriousUnit9(data.text) : data.text;
    return { text, confidence: data.confidence };
  } finally {
    await worker.terminate();
  }
}
