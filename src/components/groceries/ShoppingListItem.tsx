import { component$, type PropFunction } from "@builder.io/qwik";
import type { GroceryItem } from "~/db/groceries";

interface ShoppingListItemProps {
  item: GroceryItem;
  isLastBought: boolean;
  onToggle$: PropFunction<(item: GroceryItem) => void>;
}

export default component$(({ item, isLastBought, onToggle$ }: ShoppingListItemProps) => {
  return (
    <li
      class={`p-3 border rounded cursor-pointer transition-colors relative ${
        item.bought ? "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      } ${isLastBought ? "ring-2 ring-blue-400 border-blue-400" : ""}`}
      onClick$={() => onToggle$(item)}
      data-testid={`shopping-item-${item.id}`}
    >
      <div class="flex items-center justify-between">
        <span
          class={`text-lg ${
            item.bought ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-800 dark:text-gray-200"
          } ${item.urgent && !item.bought ? "text-red-600 dark:text-red-400 font-bold" : ""}`}
        >
          {item.name}
        </span>
        {!(item.amount === 1 && item.unit === "x") && (
          <span
            class={`font-semibold ml-2 ${
              item.bought ? "text-gray-300 dark:text-gray-600 line-through" : "text-blue-600 dark:text-blue-400"
            }`}
          >
            {item.amount}
            {item.unit}
          </span>
        )}
      </div>
      {item.description && (
        <p
          class={`text-sm mt-1 ${
            item.bought ? "text-gray-300 dark:text-gray-600 line-through" : "text-gray-600 dark:text-gray-400"
          }`}
        >
          {item.description}
        </p>
      )}
      {isLastBought && (
        <span class="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
          Ostatni
        </span>
      )}
    </li>
  );
});
