import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import type { GroceryItem } from "~/db/groceries";

export default component$(() => {
  const items = useSignal<GroceryItem[]>([]);
  const isLoading = useSignal(true);

  const fetchItems = $(async () => {
    isLoading.value = true;
    try {
      const response = await fetch("/api/groceries");
      if (response.ok) {
        items.value = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch groceries:", error);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(() => {
    fetchItems();
  });

  const handleToggleBought = $(async (item: GroceryItem) => {
    try {
      const response = await fetch(`/api/groceries/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bought: !item.bought }),
      });

      if (response.ok) {
        // Optimistic update or just refetch. Let's do optimistic for better UX
        items.value = items.value.map(i => 
          i.id === item.id ? { ...i, bought: !i.bought } : i
        );
      }
    } catch (error) {
      console.error("Failed to toggle bought status:", error);
    }
  });

  return (
    <div class="p-4">
      {isLoading.value ? (
        <div class="flex justify-center py-4">
          <Loader size="sm" color="border-blue-500" />
        </div>
      ) : (
        <>
          {items.value.length === 0 ? (
            <p class="text-lg text-gray-500" data-testid="empty-state">Brak pozycji</p>
          ) : (
            <ul class="space-y-2">
              {items.value.map((item) => (
                <li
                  key={item.id}
                  class={`p-3 border rounded cursor-pointer transition-colors ${
                    item.bought ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"
                  }`}
                  onClick$={() => handleToggleBought(item)}
                  data-testid={`grocery-item-${item.id}`}
                >
                  <div class="flex items-center justify-between">
                    <span
                      class={`text-lg ${
                        item.bought ? "text-gray-400 line-through" : "text-gray-800"
                      } ${item.urgent && !item.bought ? "text-red-600 font-bold" : ""}`}
                    >
                      {item.name}
                    </span>
                    {!(item.amount === 1 && item.unit === "x") && (
                      <span class={`font-semibold ml-2 ${item.bought ? "text-gray-300 line-through" : "text-blue-600"}`}>
                        {item.amount}{item.unit}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p class={`text-sm mt-1 ${item.bought ? "text-gray-300 line-through" : "text-gray-600"}`}>
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
});
