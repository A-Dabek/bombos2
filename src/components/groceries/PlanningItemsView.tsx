import { component$, type PropFunction } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import Loader from "~/components/shared/Loader";
import { HiPlusOutline, HiCameraOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import type { Aisle } from "~/db/shops";
import GroceryItemRow from "./GroceryItemRow";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface PlanningItemsViewProps {
  items: GroceryItem[];
  aisles: Aisle[];
  manuallyCompletedAisles: number[];
  suggestions: { name: string; buy_count: number }[];
  isLoading: boolean;
  activeItemId: number | null;
  lastAddedId: number | null;
  onItemClick$: PropFunction<(itemId: number) => void>;
  onEditClick$: PropFunction<(item: GroceryItem) => void>;
  onRemove$: PropFunction<(itemId: number) => void>;
  onAmountChange$: PropFunction<(itemId: number, newAmount: number) => void>;
  onAddClick$: PropFunction<() => void>;
  onAddSuggestion$: PropFunction<(name: string) => void>;
  onRemoveAll$: PropFunction<() => void>;
  onRemoveBought$: PropFunction<() => void>;
}

export default component$(
  ({
    items,
    aisles,
    manuallyCompletedAisles,
    suggestions,
    isLoading,
    activeItemId,
    lastAddedId,
    onItemClick$,
    onEditClick$,
    onRemove$,
    onAmountChange$,
    onAddClick$,
    onAddSuggestion$,
    onRemoveAll$,
    onRemoveBought$,
  }: PlanningItemsViewProps) => {
    const unassigned: GroceryItem[] = [];
    const byAisle = new Map<number, GroceryItem[]>();
    const knownAisles = new Set(aisles.map((a) => a.id));
    for (const item of items) {
      if (item.aisleId == null || !knownAisles.has(item.aisleId)) {
        unassigned.push(item);
      } else {
        const list = byAisle.get(item.aisleId) ?? [];
        list.push(item);
        byAisle.set(item.aisleId, list);
      }
    }

    const groups: { key: number | null; name: string; items: GroceryItem[] }[] = [];
    for (const aisle of aisles) {
      const list = byAisle.get(aisle.id);
      if (list && list.length > 0) {
        groups.push({ key: aisle.id, name: aisle.name, items: list });
      }
    }
    if (unassigned.length > 0) {
      groups.push({ key: null, name: "Bez alejki", items: unassigned });
    }

    const sortedGroups = [...groups].sort((a, b) => {
      const aDone =
        (a.key !== null && manuallyCompletedAisles.includes(a.key)) ||
        (a.items.length > 0 && a.items.every((i) => i.bought));
      const bDone =
        (b.key !== null && manuallyCompletedAisles.includes(b.key)) ||
        (b.items.length > 0 && b.items.every((i) => i.bought));

      if (aDone !== bDone) return aDone ? 1 : -1;
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return 0;
    });

    return (
      <div class="p-4">
        {isLoading ? (
          <div class="flex justify-center py-4">
            <Loader size="sm" color="border-blue-500" />
          </div>
        ) : (
          <>
            <div class="mb-4">
              {items.some((i) => i.bought) ? (
                <DoubleConfirmButton
                  onConfirm$={onRemoveBought$}
                  plain
                  text="Usuń kupione"
                  data-testid="delete-bought-btn"
                  class="w-full px-3 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 text-sm font-medium"
                />
              ) : (
                <DoubleConfirmButton
                  onConfirm$={onRemoveAll$}
                  plain
                  disabled={items.length === 0}
                  text="Usuń wszystkie"
                  data-testid="delete-all-btn"
                  class={`w-full px-3 py-2 rounded text-sm font-medium ${
                    items.length === 0
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                />
              )}
            </div>

            {items.length === 0 ? (
              <p class="text-lg text-gray-500 dark:text-gray-400" data-testid="empty-state">
                Brak pozycji
              </p>
            ) : (
              <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
                <div class="space-y-6">
                  {sortedGroups.map((group) => (
                    <div key={group.key ?? "unassigned"} class="space-y-2">
                      <h3 class="text-sm font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-1">
                        {group.name}
                      </h3>
                      <ul class="space-y-2">
                        {group.items.map((item) => (
                          <GroceryItemRow
                            key={item.id}
                            item={item}
                            isActive={activeItemId === item.id}
                            isLastAdded={lastAddedId === item.id}
                            onItemClick$={onItemClick$}
                            onEditClick$={onEditClick$}
                            onRemove$={onRemove$}
                            onAmountChange$={onAmountChange$}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div class="mt-4">
              <button
                onClick$={onAddClick$}
                data-testid="add-item-btn"
                class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full justify-center"
              >
                <HiPlusOutline class="w-5 h-5 mr-1" />
                <span>Dodaj nową</span>
              </button>
            </div>

            <div class="mt-2">
              <Link
                href="/groceries/import"
                data-testid="import-recipe-btn"
                class="flex items-center px-3 py-2 bg-white dark:bg-gray-800 border border-blue-500 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-950 w-full justify-center"
              >
                <HiCameraOutline class="w-5 h-5 mr-1" />
                <span>Import ze zdjęcia</span>
              </Link>
            </div>

            {suggestions.length > 0 && (
              <div class="mt-6">
                <h3 class="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Sugestie
                </h3>
                <div class="flex flex-wrap gap-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.name}
                      onClick$={() => onAddSuggestion$(suggestion.name)}
                      class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700"
                    >
                      + {suggestion.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);
