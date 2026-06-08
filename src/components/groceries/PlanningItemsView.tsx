import { component$, type PropFunction } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import { HiPlusOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import GroceryItemRow from "./GroceryItemRow";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface PlanningItemsViewProps {
  items: GroceryItem[];
  isLoading: boolean;
  activeItemId: number | null;
  onItemClick$: PropFunction<(itemId: number) => void>;
  onEditClick$: PropFunction<(item: GroceryItem) => void>;
  onRemove$: PropFunction<(itemId: number) => void>;
  onAmountChange$: PropFunction<(itemId: number, newAmount: number) => void>;
  onAddClick$: PropFunction<() => void>;
  onRemoveAll$: PropFunction<() => void>;
}

export default component$(
  ({
    items,
    isLoading,
    activeItemId,
    onItemClick$,
    onEditClick$,
    onRemove$,
    onAmountChange$,
    onAddClick$,
    onRemoveAll$,
  }: PlanningItemsViewProps) => {
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
                <ul class="space-y-2">
                  {items.map((item) => (
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
                onConfirm$={onRemoveAll$}
                disabled={items.length === 0}
                text="Usuń wszystkie"
                data-testid="delete-all-btn"
                class={`px-3 py-2 rounded ${
                  items.length === 0 ? "bg-gray-200 text-gray-400" : ""
                }`}
              />
            </div>
          </>
        )}
      </div>
    );
  },
);
