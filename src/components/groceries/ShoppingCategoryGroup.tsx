import { component$, type PropFunction } from "@builder.io/qwik";
import type { GroceryItem } from "~/db/groceries";
import ShoppingListItem from "./ShoppingListItem";

interface ShoppingCategoryGroupProps {
  category: string;
  items: GroceryItem[];
  showHeading: boolean;
  lastBoughtId: number | null;
  onToggle$: PropFunction<(item: GroceryItem) => void>;
}

export default component$(
  ({
    category,
    items,
    showHeading,
    lastBoughtId,
    onToggle$,
  }: ShoppingCategoryGroupProps) => {
    return (
      <div class="space-y-2">
        {showHeading && (
          <h3 class="text-xs font-bold uppercase tracking-wider border-b pb-1 text-gray-400 border-gray-100">
            {category}
          </h3>
        )}
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
