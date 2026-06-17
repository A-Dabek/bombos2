import { component$, type PropFunction } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import { HiPlusOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import GroceryItemRow from "./GroceryItemRow";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface PlanningItemsViewProps {
  items: GroceryItem[];
  manuallyCompletedCategories: string[];
  isLoading: boolean;
  activeItemId: number | null;
  onItemClick$: PropFunction<(itemId: number) => void>;
  onEditClick$: PropFunction<(item: GroceryItem) => void>;
  onRemove$: PropFunction<(itemId: number) => void>;
  onAmountChange$: PropFunction<(itemId: number, newAmount: number) => void>;
  onAddClick$: PropFunction<() => void>;
  onRemoveAll$: PropFunction<() => void>;
  onRemoveBought$: PropFunction<() => void>;
}

export default component$(
  ({
    items,
    manuallyCompletedCategories,
    isLoading,
    activeItemId,
    onItemClick$,
    onEditClick$,
    onRemove$,
    onAmountChange$,
    onAddClick$,
    onRemoveAll$,
    onRemoveBought$,
  }: PlanningItemsViewProps) => {
    const groupedItems = items.reduce(
      (acc, item) => {
        const cat = item.category || "Inne";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      },
      {} as Record<string, GroceryItem[]>,
    );

    const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
      const aDone =
        manuallyCompletedCategories.includes(a) ||
        (groupedItems[a].length > 0 && groupedItems[a].every((i) => i.bought));
      const bDone =
        manuallyCompletedCategories.includes(b) ||
        (groupedItems[b].length > 0 && groupedItems[b].every((i) => i.bought));

      if (aDone !== bDone) return aDone ? 1 : -1;

      if (a === "Inne") return 1;
      if (b === "Inne") return -1;
      return a.localeCompare(b);
    });

    return (
      <div class="p-4">
        {isLoading ? (
          <div class="flex justify-center py-4">
            <Loader size="sm" color="border-blue-500" />
          </div>
        ) : (
          <>
            {items.length === 0 ? (
              <p class="text-lg text-gray-500" data-testid="empty-state">
                Brak pozycji
              </p>
            ) : (
              <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
                <div class="space-y-6">
                  {sortedCategories.map((category) => (
                    <div key={category} class="space-y-2">
                      <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-1">
                        {category}
                      </h3>
                      <ul class="space-y-2">
                        {groupedItems[category].map((item) => (
                          <GroceryItemRow
                            key={item.id}
                            item={item}
                            isActive={activeItemId === item.id}
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

            <div class="flex space-x-2 mt-4">
              <button
                onClick$={onAddClick$}
                data-testid="add-item-btn"
                class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <HiPlusOutline class="w-5 h-5 mr-1" />
                <span>Dodaj nową</span>
              </button>
              <DoubleConfirmButton
                onConfirm$={onRemoveBought$}
                disabled={!items.some((i) => i.bought)}
                text="Usuń kupione"
                data-testid="delete-bought-btn"
                class={`px-3 py-2 rounded ${
                  !items.some((i) => i.bought) ? "bg-gray-200 text-gray-400" : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              />
              <DoubleConfirmButton
                onConfirm$={onRemoveAll$}
                disabled={items.length === 0}
                text="Usuń wszystkie"
                data-testid="delete-all-btn"
                class={`px-3 py-2 rounded ${
                  items.length === 0 ? "bg-gray-200 text-gray-400" : "bg-red-500 text-white hover:bg-red-600"
                }`}
              />
            </div>
          </>
        )}
      </div>
    );
  },
);
