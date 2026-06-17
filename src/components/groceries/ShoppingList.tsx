import { component$, useSignal, useVisibleTask$, $, useContext } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import type { GroceryItem } from "~/db/groceries";
import CategoryFilter from "./CategoryFilter";
import ShoppingCategoryGroup from "./ShoppingCategoryGroup";
import { RefreshContext } from "~/constants/refresh";

export default component$(() => {
  const items = useSignal<GroceryItem[]>([]);
  const manuallyCompletedCategories = useSignal<string[]>([]);
  const isLoading = useSignal(true);
  const selectedCategory = useSignal("All");
  const lastBoughtId = useSignal<number | null>(null);
  const refreshSignal = useContext(RefreshContext);

  const fetchItems = $(async () => {
    isLoading.value = true;
    try {
      const [resp, compResp] = await Promise.all([
        fetch("/api/groceries"),
        fetch("/api/groceries/completed-categories"),
      ]);

      if (resp.ok) {
        items.value = await resp.json();
      }
      if (compResp.ok) {
        manuallyCompletedCategories.value = await compResp.json();
      }
    } catch (error) {
      console.error("Failed to fetch groceries:", error);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => refreshSignal.value);
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

  const handleToggleCategoryCompleted = $(async (category: string) => {
    const isCompleted = manuallyCompletedCategories.value.includes(category);
    try {
      const response = await fetch("/api/groceries/completed-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, completed: !isCompleted }),
      });

      if (response.ok) {
        if (isCompleted) {
          manuallyCompletedCategories.value = manuallyCompletedCategories.value.filter(
            (c) => c !== category,
          );
        } else {
          manuallyCompletedCategories.value = [
            ...manuallyCompletedCategories.value,
            category,
          ];
        }
      }
    } catch (error) {
      console.error("Failed to toggle category completed status:", error);
    }
  });

  const rawCategories = [...new Set(items.value.map((i) => i.category || "Inne"))];

  const completedCategories = ["All", ...rawCategories].filter((cat) => {
    if (items.value.length === 0) return false;
    if (cat === "All") return items.value.every((i) => i.bought);
    if (manuallyCompletedCategories.value.includes(cat)) return true;
    const catItems = items.value.filter((i) => (i.category || "Inne") === cat);
    return catItems.length > 0 && catItems.every((i) => i.bought);
  });

  const allCategories = ["All", ...rawCategories].sort((a, b) => {
    if (a === "All") return -1;
    if (b === "All") return 1;

    const aDone = completedCategories.includes(a);
    const bDone = completedCategories.includes(b);
    if (aDone !== bDone) return aDone ? 1 : -1;

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

  const activeCategories =
    selectedCategory.value === "All"
      ? Object.keys(groupedItems).sort((a, b) => {
          const aDone = completedCategories.includes(a);
          const bDone = completedCategories.includes(b);
          if (aDone !== bDone) return aDone ? 1 : -1;

          if (a === "Inne") return 1;
          if (b === "Inne") return -1;
          return a.localeCompare(b);
        })
      : [selectedCategory.value].filter((c) => groupedItems[c]);

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
                {activeCategories.map((category) => (
                  <ShoppingCategoryGroup
                    key={category}
                    category={category}
                    items={groupedItems[category] || []}
                    showHeading={true}
                    lastBoughtId={lastBoughtId.value}
                    isCompleted={completedCategories.includes(category)}
                    isManuallyCompleted={manuallyCompletedCategories.value.includes(
                      category,
                    )}
                    onToggle$={handleToggleBought}
                    onToggleCategoryCompleted$={handleToggleCategoryCompleted}
                  />
                ))}
                {selectedCategory.value === "All" && activeCategories.length > 0 && activeCategories.every(cat => completedCategories.includes(cat)) && (
                  <p class="text-center text-gray-500 py-8">
                    Wszystkie kategorie są skończone
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
