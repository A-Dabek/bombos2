import { component$, useSignal, type PropFunction } from "@builder.io/qwik";
import type { Aisle } from "~/db/shops";
import type { ImportConfirmItem, ImportDraftItem, ImportReviewRow } from "./types";
import { ReviewRowItem } from "./ReviewRowItem";

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
    const draft = useSignal<ImportReviewRow[]>(
      items.map((item) => ({ ...item, aisleId: undefined })),
    );
    const localError = useSignal<string | null>(null);

    const deleteRow = (index: number) => {
      draft.value = draft.value.filter((_, i) => i !== index);
    };

    const applySuggestion = (index: number) => {
      const suggested = draft.value[index]?.match.name;
      if (!suggested) return;
      draft.value = draft.value.map((r, i) =>
        i === index
          ? { ...r, name: suggested, match: { ...r.match, type: "known", name: suggested } }
          : r,
      );
    };

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
          {draft.value.map((row, index) => (
            <ReviewRowItem
              key={index}
              row={row}
              index={index}
              aisles={aisles}
              onDelete={deleteRow}
              onApplySuggestion={applySuggestion}
            />
          ))}
        </ul>

        {draft.value.length === 0 && (
          <p class="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Brak pozycji do zaimportowania.
          </p>
        )}

        {localError.value && (
          <p
            class="mt-4 text-sm text-red-600 dark:text-red-400"
            data-testid="import-review-error"
          >
            {localError.value}
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
              localError.value = null;
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
              if (rows.length === 0) {
                localError.value = "Brak pozycji do zaimportowania.";
                return;
              }
              if (rows.length !== draft.value.length) {
                localError.value = "Uzupełnij nazwy wszystkich pozycji.";
                return;
              }
              onConfirm$(rows);
            }}
            disabled={confirming || draft.value.length === 0}
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
