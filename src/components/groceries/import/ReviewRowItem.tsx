import { HiTrashOutline } from "@qwikest/icons/heroicons";
import type { Aisle } from "~/db/shops";
import type { ImportReviewRow, ImportUnit } from "./types";
import { inventoryLabel, matchBadge } from "./match-badge";

const UNITS: ImportUnit[] = ["x", "g", "kg", "l", "ml"];

interface ReviewRowItemProps {
  row: ImportReviewRow;
  index: number;
  aisles: Aisle[];
  onDelete: (index: number) => void;
  onApplySuggestion: (index: number) => void;
}

// Plain function (not component$) so it re-renders with the parent list.
export function ReviewRowItem({
  row,
  index,
  aisles,
  onDelete,
  onApplySuggestion,
}: ReviewRowItemProps) {
  const badge = matchBadge(row.match);
  return (
    <li
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
          onClick$={() => onDelete(index)}
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
        {badge &&
          (badge.clickable ? (
            <button
              type="button"
              data-testid={`import-match-${index}`}
              class={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.class}`}
              onClick$={() => onApplySuggestion(index)}
            >
              {badge.label}
            </button>
          ) : (
            <span
              data-testid={`import-match-${index}`}
              class={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.class}`}
            >
              {badge.label}
            </span>
          ))}
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
}
