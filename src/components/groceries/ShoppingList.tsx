import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import type { GroceryItem } from "~/db/groceries";
import CategoryFilter from "./CategoryFilter";
import ShoppingCategoryGroup from "./ShoppingCategoryGroup";

export default component$(() => {
  const items = useSignal<GroceryItem[]>([]);
  const isLoading = useSignal(true);
  const selectedCategory = useSignal("All");
  const lastBoughtId = useSignal<number | null>(null);

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
        const wasBought = !item.bought;
        // Optimistic update
        items.value = items.value.map((i) =>
          i.id === item.id ? { ...i, bought: wasBought } : i,
        );
        if (wasBought) {
          lastBoughtId.value = item.id;
        } else if (lastBoughtId.value === item.id) {
          lastBoughtId.value = null;
        }
      }
    } catch (error) {
      console.error("Failed to toggle bought status:", error);
    }
  });

  const allCategories = [
    "All",
    ...new Set(items.value.map((i) => i.category || "Inne")),
  ].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;
    if (a === "Inne") return 1;
    if (b === "Inne") return -1;
    return a.localeCompare(b);
  });

  const filteredItems = items.value.filter((item) => {
    if (selectedCategory.value === "All") return true;
    const cat = item.category || "Inne";
    return cat === selectedCategory.value;
  });

  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      const cat = item.category || "Inne";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, GroceryItem[]>,
  );

  const displayCategories =
    selectedCategory.value === "All"
      ? Object.keys(groupedItems).sort((a, b) => {
          if (a === "Inne") return 1;
          if (b === "Inne") return -1;
          return a.localeCompare(b);
        })
      : [selectedCategory.value].filter((c) => groupedItems[c]);

  const completedCategories = allCategories.filter((cat) => {
    if (items.value.length === 0) return false;
    if (cat === "All") return items.value.every((i) => i.bought);
    const catItems = items.value.filter((i) => (i.category || "Inne") === cat);
    return catItems.length > 0 && catItems.every((i) => i.bought);
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
            <p class="text-lg text-gray-500" data-testid="empty-state">
              Brak pozycji
            </p>
          ) : (
            <>
              <CategoryFilter
                categories={allCategories}
                selectedCategory={selectedCategory.value}
                completedCategories={completedCategories}
                onSelect$={(category) => (selectedCategory.value = category)}
              />

              <div class="space-y-6">
                {displayCategories.map((category) => (
                  <ShoppingCategoryGroup
                    key={category}
                    category={category}
                    items={groupedItems[category] || []}
                    showHeading={selectedCategory.value === "All"}
                    lastBoughtId={lastBoughtId.value}
                    onToggle$={handleToggleBought}
                  />
                ))}
                {displayCategories.length === 0 && (
                  <p class="text-center text-gray-500 py-8">
                    Brak brakujących produktów w tej kategorii
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
});
