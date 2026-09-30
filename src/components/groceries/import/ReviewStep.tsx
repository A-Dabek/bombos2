import { component$, useSignal, type PropFunction } from "@builder.io/qwik";
import type { Aisle } from "~/db/shops";
import { HiTrashOutline } from "@qwikest/icons/heroicons";
import type { ImportConfirmItem, ImportDraftItem, ImportUnit } from "./types";

const UNITS: ImportUnit[] = ["x", "g", "kg", "l", "ml"];

interface ReviewRow extends ImportDraftItem {
  aisleId: number | null | undefined;
}

function matchBadge(match: ImportDraftItem["match"]): { label: string; class: string } {
  const qty = match.amount !== undefined ? ` ${match.amount} ${match.unit ?? "x"}` : "";
  if (match.type === "existing") {
    return {
      label: qty ? `Masz na liście:${qty}` : "Masz na liście",
      class: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    };
  }
  if (match.type === "possible") {
    return {
      label: `Może: ${match.name ?? ""}${qty ? ` (${qty.trim()})` : ""}`,
      class: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    };
  }
  return {
    label: "Nowe",
    class: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
}

function inventoryLabel(daysAgo: number): string {
  if (daysAgo <= 0) return "Prawdopodobnie masz (kupione dzisiaj)";
  if (daysAgo === 1) return "Prawdopodobnie masz (kupione wczoraj)";
  return `Prawdopodobnie masz (kupione ${daysAgo} dni temu)`;
}

interface ReviewStepProps {
  items: ImportDraftItem[];
  aisles: Aisle[];
  confirming: boolean;
  error: string | null;
  onConfirm$: PropFunction<(items: ImportConfirmItem[]) => void>;
  onBack$: PropFunction<() => void>;
}

export default component$(
  ({ items, aisles, confirming, error, onConfirm$, onBack$ }: ReviewStepProps) => {
    const draft = useSignal<ReviewRow[]>(
      items.map((item) => ({ ...item, aisleId: undefined })),
    );

    const hasInvalidName = () => draft.value.some((row) => row.name.trim().length === 0);

    return (
      <div class="mx-auto max-w-md">
        <h1 class="mb-1 text-xl font-semibold text-gray-800 dark:text-gray-100">
          Sprawdź składniki
        </h1>
        <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Popraw nazwy, ilości i alejki. Nic nie zostanie zapisane, dopóki nie zatwierdzisz.
        </p>

        {error && (
          <p class="mb-4 text-sm text-red-600 dark:text-red-400" data-testid="import-error">
            {error}
          </p>
        )}

        <ul class="space-y-3">
          {draft.value.map((row, index) => {
            const badge = matchBadge(row.match);
            return (
              <li
                key={index}
                data-testid={`import-row-${index}`}
                class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
              >
                <div class="flex items-start gap-2">
                  <input
                    type="text"
                    value={row.name}
                    maxLength={100}
                    name={`import-name-${index}`}
                    data-testid={`import-name-${index}`}
                    onInput$={(event) => {
                      row.name = (event.target as HTMLInputElement).value;
                    }}
                    class="min-w-0 flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
                  />
                  <button
                    onClick$={() => {
                      draft.value = draft.value.filter((_, i) => i !== index);
                    }}
                    aria-label="Usuń pozycję"
                    data-testid={`import-delete-${index}`}
                    class="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <HiTrashOutline class="h-5 w-5" />
                  </button>
                </div>

                {row.raw && (
                  <p
                    class="mt-1 truncate text-xs text-gray-400 dark:text-gray-500"
                    data-testid={`import-raw-${index}`}
                    title={row.raw}
                  >
                    {row.raw}
                  </p>
                )}

                <div class="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.amount}
                    name={`import-amount-${index}`}
                    data-testid={`import-amount-${index}`}
                    onInput$={(event) => {
                      const value = parseFloat((event.target as HTMLInputElement).value);
                      row.amount = Number.isFinite(value) && value > 0 ? value : 1;
                    }}
                    class="w-20 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
                  />
                  <select
                    value={row.unit}
                    name={`import-unit-${index}`}
                    data-testid={`import-unit-${index}`}
                    onChange$={(event) => {
                      row.unit = (event.target as HTMLSelectElement).value as ImportUnit;
                    }}
                    class="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.aisleId === undefined ? "" : row.aisleId === null ? "none" : String(row.aisleId)}
                    name={`import-aisle-${index}`}
                    data-testid={`import-aisle-${index}`}
                    onChange$={(event) => {
                      const value = (event.target as HTMLSelectElement).value;
                      row.aisleId = value === "" ? undefined : value === "none" ? null : Number(value);
                    }}
                    class="min-w-0 flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm text-gray-800 dark:text-gray-100"
                  >
                    <option value="">Automatycznie</option>
                    <option value="none">Bez alejki</option>
                    {aisles.map((aisle) => (
                      <option key={aisle.id} value={aisle.id.toString()}>
                        {aisle.name}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={row.description}
                  maxLength={300}
                  placeholder="Opis (opcjonalnie)"
                  name={`import-description-${index}`}
                  data-testid={`import-description-${index}`}
                  onInput$={(event) => {
                    row.description = (event.target as HTMLInputElement).value;
                  }}
                  class="mt-2 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-600 dark:text-gray-300"
                />

                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    data-testid={`import-match-${index}`}
                    class={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.class}`}
                  >
                    {badge.label}
                  </span>
                  {row.inventory && (
                    <span
                      data-testid={`import-inventory-${index}`}
                      class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
                    >
                      {inventoryLabel(row.inventory.daysAgo)}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {draft.value.length === 0 && (
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Brak pozycji do zaimportowania.
          </p>
        )}

        <div class="mt-5 flex gap-2">
          <button
            onClick$={onBack$}
            disabled={confirming}
            data-testid="import-back-btn"
            class="flex-1 rounded bg-gray-200 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Wróć
          </button>
          <button
            onClick$={() => {
              const rows = draft.value
                .map((row) => ({
                  name: row.name.trim(),
                  amount: row.amount,
                  unit: row.unit,
                  description: row.description.trim() || undefined,
                  aisleId: row.aisleId,
                  sourceName: row.sourceName,
                }))
                .filter((row) => row.name.length > 0);
              onConfirm$(rows);
            }}
            disabled={confirming || draft.value.length === 0 || hasInvalidName()}
            data-testid="import-confirm-btn"
            class="flex-1 rounded bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {confirming ? "Zapisuję…" : "Dodaj do listy"}
          </button>
        </div>
      </div>
    );
  },
);
