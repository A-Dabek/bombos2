import type { ImportDraftItem } from "./types";

export interface MatchBadge {
  label: string;
  class: string;
  clickable: boolean;
}

export function matchBadge(match: ImportDraftItem["match"]): MatchBadge | null {
  const qty = match.amount !== undefined ? ` ${match.amount} ${match.unit ?? "x"}` : "";
  if (match.type === "existing") {
    return {
      label: qty ? `Masz na liście:${qty}` : "Masz na liście",
      class: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      clickable: false,
    };
  }
  if (match.type === "known") {
    return null;
  }
  if (match.type === "possible") {
    return {
      label: `Może: ${match.name ?? ""}${qty ? ` (${qty.trim()})` : ""}`,
      class: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      clickable: true,
    };
  }
  return {
    label: "Nowe",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    clickable: false,
  };
}

export function inventoryLabel(daysAgo: number): string {
  if (daysAgo <= 0) return "Prawdopodobnie masz (kupione dzisiaj)";
  if (daysAgo === 1) return "Prawdopodobnie masz (kupione wczoraj)";
  return `Prawdopodobnie masz (kupione ${daysAgo} dni temu)`;
}
