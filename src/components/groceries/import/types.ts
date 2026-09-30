export type ImportUnit = "x" | "g" | "kg" | "l" | "ml";

export interface ImportMatch {
  type: "existing" | "new" | "possible";
  name: string | null;
  confidence: number;
}

export interface ImportInventory {
  boughtAt: number;
  daysAgo: number;
}

export interface ImportDraftItem {
  name: string;
  amount: number;
  unit: ImportUnit;
  description: string;
  match: ImportMatch;
  inventory: ImportInventory | null;
  sourceName: string;
}

export interface ImportConfirmItem {
  name: string;
  amount: number;
  unit: ImportUnit;
  description?: string;
  aisleId?: number | null;
  sourceName?: string;
}
