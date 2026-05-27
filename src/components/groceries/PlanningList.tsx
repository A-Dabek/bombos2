import { component$, useSignal, useVisibleTask$, $, useTask$ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import { HiPlusOutline } from "@qwikest/icons/heroicons";
import type { GroceryItem } from "~/db/groceries";
import GroceryItemRow from "./GroceryItemRow";
import GroceryForm from "./GroceryForm";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

export default component$(() => {
  const items = useSignal<GroceryItem[]>([]);
  const isLoading = useSignal(true);
  const formMode = useSignal<"none" | "add" | "edit">("none");
  const activeItemId = useSignal<number | null>(null);
  const editingItem = useSignal<GroceryItem | null>(null);

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

  const handleSave = $(async (name: string, description: string, urgent: boolean) => {
    const isEdit = formMode.value === "edit";
    const url = isEdit ? `/api/groceries/${editingItem.value?.id}` : "/api/groceries";
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, urgent }),
      });

      if (response.ok) {
        await fetchItems();
        formMode.value = "none";
        editingItem.value = null;
        activeItemId.value = null;
      }
    } catch (error) {
      console.error("Failed to save grocery item:", error);
    }
  });

  const handleNext = $(async (name: string, description: string, urgent: boolean) => {
    try {
      const response = await fetch("/api/groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, urgent }),
      });

      if (response.ok) {
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

  return (
    <div class="relative overflow-hidden" style="min-height: 200px;">
      {/* Items View */}
      <div
        class={`transition-transform duration-300 ease-in-out ${
          formMode.value === "none" ? "translate-x-0" : "-translate-x-full hidden"
        }`}
      >
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
                <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
                  <ul class="space-y-2">
                    {items.value.map((item) => (
                      <GroceryItemRow
                        key={item.id}
                        item={item}
                        isActive={activeItemId.value === item.id}
                        onItemClick$={handleItemClick}
                        onEditClick$={handleEditClick}
                        onRemove$={handleRemove}
                      />
                    ))}
                  </ul>
                </div>
              )}

              <div class="flex space-x-2 mt-4">
                <button
                  onClick$={handleAddClick}
                  data-testid="add-item-btn"
                  class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <HiPlusOutline class="w-5 h-5 mr-1" />
                  <span>Dodaj nową</span>
                </button>
                <DoubleConfirmButton
                  onConfirm$={handleRemoveAll}
                  disabled={items.value.length === 0}
                  text="Usuń wszystkie"
                  data-testid="delete-all-btn"
                  class={`px-3 py-2 rounded ${items.value.length === 0 ? "bg-gray-200 text-gray-400" : ""}`}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form View - slides in from right */}
      <div
        class={`${
          formMode.value !== "none" ? "relative" : "absolute"
        } top-0 left-0 w-full transition-transform duration-300 ease-in-out bg-white ${
          formMode.value !== "none" ? "translate-x-0" : "translate-x-full"
        }`}
        style={formMode.value !== "none" ? "min-height: 200px;" : ""}
      >
        {formMode.value !== "none" && (
          <GroceryForm
            mode={formMode.value as "add" | "edit"}
            initialName={
              formMode.value === "edit" && editingItem.value ? editingItem.value.name : ""
            }
            initialDescription={
              formMode.value === "edit" && editingItem.value
                ? editingItem.value.description || ""
                : ""
            }
            initialUrgent={
              formMode.value === "edit" && editingItem.value
                ? editingItem.value.urgent
                : false
            }
            onSave$={handleSave}
            onNext$={handleNext}
            onCancel$={handleCancel}
          />
        )}
      </div>
    </div>
  );
});
