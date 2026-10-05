export const PSM_VALUES = {
  AUTO: "3",
  SINGLE_COLUMN: "4",
  SINGLE_BLOCK: "6",
  SINGLE_LINE: "7",
  SPARSE_TEXT: "11",
} as const;

export interface OcrOptions {
  scale: number;
  psm: string;
  binarize: boolean;
  stripSpuriousUnit9: boolean;
  maxWidth: number;
}

const DEFAULT_SCALE = 2;
const DEFAULT_PSM = PSM_VALUES.SINGLE_BLOCK;
const DEFAULT_MAX_WIDTH = 4000;

const PSM_BY_NAME = new Map<string, string>(
  Object.entries(PSM_VALUES).map(([name, value]) => [name.toUpperCase(), value]),
);
const PSM_NUMBERS = new Set<string>(Object.values(PSM_VALUES));

function toBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function toScale(value: string | undefined): number {
  if (!value) return DEFAULT_SCALE;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_SCALE;
  return Math.min(4, Math.max(1, parsed));
}

function toPsm(value: string | undefined): string {
  if (!value) return DEFAULT_PSM;
  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_PSM;
  const byName = PSM_BY_NAME.get(trimmed.toUpperCase());
  if (byName) return byName;
  if (PSM_NUMBERS.has(trimmed)) return trimmed;
  return DEFAULT_PSM;
}

export function resolveOcrOptions(env: NodeJS.ProcessEnv = process.env): OcrOptions {
  return {
    scale: toScale(env.OCR_SCALE),
    psm: toPsm(env.OCR_PSM),
    binarize: toBoolean(env.OCR_BINARIZE),
    stripSpuriousUnit9: toBoolean(env.OCR_STRIP_SPURIOUS_9),
    maxWidth: DEFAULT_MAX_WIDTH,
  };
}

export function stripSpuriousUnit9(text: string): string {
  return text.replace(/(\d)9(\s*(?:kg|dag|ml|g|l)\b)/giu, "$1$2");
}
