import { component$ } from "@builder.io/qwik";
import { HiPencilOutline, HiPlusOutline, HiMinusOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface GroceryItemRowProps {
  item: GroceryItem;
  isActive: boolean;
  onItemClick$: (itemId: number) => void;
  onEditClick$: (item: GroceryItem) => void;
  onRemove$: (itemId: number) => void;
  onAmountChange$: (itemId: number, newAmount: number) => void;
}

export default component$(({
  item,
  isActive,
  onItemClick$,
  onEditClick$,
  onRemove$,
  onAmountChange$,
}: GroceryItemRowProps) => {
  return (
    <li
      key={item.id}
      class={`cursor-pointer ${
        isActive ? "p-3 bg-blue-50" : "py-1 px-2 bg-white"
      }`}
      onClick$={() => onItemClick$(item.id)}
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center justify-between">
            <span
              class={`text-gray-800 font-medium ${
                item.urgent ? "text-red-600 font-bold underline" : ""
              }`}
            >
              {item.name}
            </span>
            {!(item.amount === 1 && item.unit === "x") && (
              <span class="text-sm font-semibold text-blue-600 ml-2 bg-blue-100 px-1 rounded min-w-[3rem] text-center">
                {item.amount}{item.unit}
              </span>
            )}
          </div>
          {item.description && (
            <p class="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
        </div>
        {isActive && (
          <div
            class="flex items-center space-x-1 ml-2"
            onClick$={(e) => e.stopPropagation()}
          >
            <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white mr-2">
              <button
                onClick$={() =>
                  onAmountChange$(item.id, Math.max(0, item.amount - 1))
                }
                data-testid="decrease-amount-btn"
                class="p-1 text-gray-500 hover:bg-gray-100 border-r border-gray-200"
                aria-label="Zmniejsz ilość"
              >
                <HiMinusOutline class="w-4 h-4" />
              </button>
              <button
                onClick$={() => onAmountChange$(item.id, item.amount + 1)}
                data-testid="increase-amount-btn"
                class="p-1 text-gray-500 hover:bg-gray-100"
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
