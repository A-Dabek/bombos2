import { component$ } from "@builder.io/qwik";
import { HiPencilOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface GroceryItemRowProps {
  item: GroceryItem;
  isActive: boolean;
  onItemClick$: (itemId: number) => void;
  onEditClick$: (item: GroceryItem) => void;
  onRemove$: (itemId: number) => void;
}

export default component$(({
  item,
  isActive,
  onItemClick$,
  onEditClick$,
  onRemove$,
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
          <div class="flex items-center">
            <span class={`text-gray-800 font-medium ${item.urgent ? "text-red-600 font-bold underline" : ""}`}>
              {item.name}
            </span>
          </div>
          {item.description && (
            <p class="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
        </div>
        {isActive && (
          <div class="flex items-center space-x-1 ml-2" onClick$={(e) => e.stopPropagation()}>
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
