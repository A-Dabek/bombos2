import { component$, type PropFunction } from "@builder.io/qwik";
import type { GroceryItem } from "~/db/groceries";
import ShoppingListItem from "./ShoppingListItem";
import {
  HiCheckCircleOutline,
  HiCheckCircleSolid,
} from "@qwikest/icons/heroicons";

interface ShoppingCategoryGroupProps {
  category: string;
  items: GroceryItem[];
  showHeading: boolean;
  lastBoughtId: number | null;
  isCompleted: boolean;
  isManuallyCompleted: boolean;
  onToggle$: PropFunction<(item: GroceryItem) => void>;
  onToggleCategoryCompleted$: PropFunction<(category: string) => void>;
}

export default component$(
  ({
    category,
    items,
    showHeading,
    lastBoughtId,
    isCompleted,
    isManuallyCompleted,
    onToggle$,
    onToggleCategoryCompleted$,
  }: ShoppingCategoryGroupProps) => {
    return (
      <div class="space-y-2">
        <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-1">
          {showHeading && (
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {category}
            </h3>
          )}
          <button
            onClick$={() => onToggleCategoryCompleted$(category)}
            data-testid={`finish-category-${category}`}
            class={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors ${
              isManuallyCompleted
                ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                : isCompleted
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 opacity-50 cursor-not-allowed"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
            disabled={isCompleted && !isManuallyCompleted}
            title={isManuallyCompleted ? "Oznacz jako niedokończone" : "Oznacz kategorię jako skończoną"}
          >
            {isManuallyCompleted || (isCompleted && !isManuallyCompleted) ? (
              <HiCheckCircleSolid class="w-3.5 h-3.5" />
            ) : (
              <HiCheckCircleOutline class="w-3.5 h-3.5" />
            )}
            <span>{isManuallyCompleted ? "Skończone" : "Skończ"}</span>
          </button>
        </div>
        <ul class="space-y-2">
          {items.map((item) => (
            <ShoppingListItem
              key={item.id}
              item={item}
              isLastBought={lastBoughtId === item.id}
              onToggle$={onToggle$}
            />
          ))}
        </ul>
      </div>
    );
  },
);
