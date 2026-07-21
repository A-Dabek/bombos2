import { component$, useSignal, useVisibleTask$, $, useContext } from "@builder.io/qwik";
import type { GroceryItem } from "~/db/groceries";
import PlanningFormView from "./PlanningFormView";
import PlanningItemsView from "./PlanningItemsView";
import { RefreshContext } from "~/constants/refresh";
import { normalizeProductName } from "~/utils/groceries";

export default component$(() => {
  const items = useSignal<GroceryItem[]>([]);
  const manuallyCompletedCategories = useSignal<string[]>([]);
  const isLoading = useSignal(true);
  const formMode = useSignal<"none" | "add" | "edit">("none");
  const activeItemId = useSignal<number | null>(null);
  const lastAddedId = useSignal<number | null>(null);
  const editingItem = useSignal<GroceryItem | null>(null);
  const suggestions = useSignal<{ name: string; buy_count: number; category: string | null }[]>([]);
  const refreshSignal = useContext(RefreshContext);

  const fetchItems = $(async () => {
    isLoading.value = true;
    try {
      const [resp, compResp, suggResp] = await Promise.all([
        fetch("/api/groceries"),
        fetch("/api/groceries/completed-categories"),
        fetch("/api/groceries/suggestions"),
      ]);

      if (resp.ok) {
        items.value = await resp.json();
      }
      if (compResp.ok) {
        manuallyCompletedCategories.value = await compResp.json();
      }
      if (suggResp.ok) {
        suggestions.value = await suggResp.json();
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

  const handleItemClick = $((itemId: number) => {
    if (activeItemId.value === itemId) {
      activeItemId.value = null;
    } else {
      activeItemId.value = itemId;
    }
  });

  const handleEditClick = $((item: GroceryItem) => {
    editingItem.value = item;
    formMode.value = "edit";
  });

  const handleAddClick = $(() => {
    editingItem.value = null;
    formMode.value = "add";
  });

  const handleCancel = $(() => {
    formMode.value = "none";
    editingItem.value = null;
  });

  const handleSave = $(
    async (
      name: string,
      description: string,
      urgent: boolean,
      amount: number,
      unit: string,
      category: string | null,
    ) => {
      const isEdit = formMode.value === "edit";
      const url = isEdit
        ? `/api/groceries/${editingItem.value?.id}`
        : "/api/groceries";
      const method = isEdit ? "PATCH" : "POST";

      try {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, urgent, amount, unit, category }),
        });

      if (response.ok) {
        const savedItem = await response.json();
        if (!isEdit) {
          lastAddedId.value = savedItem.id;
        }
        await fetchItems();
        formMode.value = "none";
        editingItem.value = null;
        activeItemId.value = null;
      }
    } catch (error) {
      console.error("Failed to save grocery item:", error);
    }
  });

  const handleNext = $(
    async (
      name: string,
      description: string,
      urgent: boolean,
      amount: number,
      unit: string,
      category: string | null,
    ) => {
      try {
        const response = await fetch("/api/groceries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, urgent, amount, unit, category }),
        });

      if (response.ok) {
        const savedItem = await response.json();
        lastAddedId.value = savedItem.id;
        await fetchItems();
        // Keep form open for next item
        editingItem.value = null;
      }
    } catch (error) {
      console.error("Failed to save grocery item (next):", error);
    }
  });

  const handleRemove = $(async (itemId: number) => {
    try {
      const response = await fetch(`/api/groceries/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchItems();
        activeItemId.value = null;
      }
    } catch (error) {
      console.error("Failed to delete grocery item:", error);
    }
  });

  const handleRemoveAll = $(async () => {
    try {
      const response = await fetch("/api/groceries", {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchItems();
        activeItemId.value = null;
      }
    } catch (error) {
      console.error("Failed to delete all groceries:", error);
    }
  });

  const handleRemoveBought = $(async () => {
    try {
      const response = await fetch("/api/groceries?bought=true", {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchItems();
        activeItemId.value = null;
      }
    } catch (error) {
      console.error("Failed to delete bought groceries:", error);
    }
  });

  const handleAddSuggestion = $(async (name: string, category: string | null) => {
    try {
      const response = await fetch("/api/groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, amount: 1, unit: "x" }),
      });

      if (response.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error("Failed to add suggestion:", error);
    }
  });

  const handleAmountChange = $(async (itemId: number, newAmount: number) => {
    try {
      const response = await fetch(`/api/groceries/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: newAmount }),
      });

      if (response.ok) {
        await fetchItems();
      }
    } catch (error) {
      console.error("Failed to update grocery amount:", error);
    }
  });

  const filteredSuggestions = suggestions.value
    .filter(
      (s) =>
        !items.value.some(
          (i) => normalizeProductName(i.name) === normalizeProductName(s.name),
        ),
    )
    .slice(0, 10);

  return (
    <div class="relative overflow-hidden" style="min-height: 200px;">
      {/* Items View */}
      <div
        class={`transition-transform duration-300 ease-in-out ${
          formMode.value === "none" ? "translate-x-0" : "-translate-x-full hidden"
        }`}
      >
        <PlanningItemsView
          items={items.value}
          manuallyCompletedCategories={manuallyCompletedCategories.value}
          suggestions={filteredSuggestions}
          isLoading={isLoading.value}
          activeItemId={activeItemId.value}
          lastAddedId={lastAddedId.value}
          onItemClick$={handleItemClick}
          onEditClick$={handleEditClick}
          onRemove$={handleRemove}
          onAmountChange$={handleAmountChange}
          onAddClick$={handleAddClick}
          onAddSuggestion$={handleAddSuggestion}
          onRemoveAll$={handleRemoveAll}
          onRemoveBought$={handleRemoveBought}
        />
      </div>

      {/* Form View - slides in from right */}
      <PlanningFormView
        formMode={formMode.value}
        editingItem={editingItem.value}
        onSave$={handleSave}
        onNext$={handleNext}
        onCancel$={handleCancel}
      />
    </div>
  );
});
