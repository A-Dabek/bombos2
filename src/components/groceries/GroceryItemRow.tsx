import { component$ } from "@builder.io/qwik";
import { HiPencilOutline, HiPlusOutline, HiMinusOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface GroceryItemRowProps {
  item: GroceryItem;
  isActive: boolean;
  isLastAdded?: boolean;
  onItemClick$: (itemId: number) => void;
  onEditClick$: (item: GroceryItem) => void;
  onRemove$: (itemId: number) => void;
  onAmountChange$: (itemId: number, newAmount: number) => void;
}

export default component$(({
  item,
  isActive,
  isLastAdded,
  onItemClick$,
  onEditClick$,
  onRemove$,
  onAmountChange$,
}: GroceryItemRowProps) => {
  return (
    <li
      key={item.id}
      data-testid={`grocery-item-${item.id}`}
      class={`cursor-pointer relative transition-all ${
        isActive ? "p-3 bg-blue-50 dark:bg-blue-950/40" : "py-1 px-2 bg-white dark:bg-gray-800"
      } ${isLastAdded ? "ring-2 ring-blue-400 border-blue-400 rounded z-10" : ""}`}
      onClick$={() => onItemClick$(item.id)}
    >
      {isLastAdded && (
        <span class="absolute -top-2 -right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm z-20">
          Ostatni
        </span>
      )}
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span
              class={`text-gray-800 dark:text-gray-200 font-medium ${
                item.urgent ? "text-red-600 dark:text-red-400 font-bold underline" : ""
              }`}
            >
              {item.name}
            </span>
            {!(item.amount === 1 && item.unit === "x") && (
              <span class="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-2 bg-blue-100 dark:bg-blue-950 px-1 rounded min-w-[3rem] text-center">
                {item.amount}{item.unit}
              </span>
            )}
          </div>
          {item.description && (
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
          )}
        </div>
        {isActive && (
          <div
            class="flex items-center space-x-1 ml-2"
            onClick$={(e) => e.stopPropagation()}
          >
            <div class="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 mr-2">
              <button
                onClick$={() =>
                  onAmountChange$(item.id, Math.max(0, item.amount - 1))
                }
                data-testid="decrease-amount-btn"
                class="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-200 dark:border-gray-700"
                aria-label="Zmniejsz ilość"
              >
                <HiMinusOutline class="w-4 h-4" />
              </button>
              <button
                onClick$={() => onAmountChange$(item.id, item.amount + 1)}
                data-testid="increase-amount-btn"
                class="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Zwiększ ilość"
              >
                <HiPlusOutline class="w-4 h-4" />
              </button>
            </div>
            <button
              onClick$={() => onEditClick$(item)}
              data-testid="edit-item-btn"
              class="p-1 text-blue-500 hover:text-blue-700"
              aria-label="Edytuj"
            >
              <HiPencilOutline class="w-5 h-5" />
            </button>
            <DoubleConfirmButton
              onConfirm$={() => onRemove$(item.id)}
              class="p-1"
              data-testid="delete-item-btn"
            />
          </div>
        )}
      </div>
    </li>
  );
});
