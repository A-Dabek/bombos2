import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { HiArrowLeftOutline, HiPlusOutline, HiTrashOutline, HiPencilOutline, HiMinusOutline, HiPlusSolid, HiCheckCircleSolid } from "@qwikest/icons/heroicons";
import type { PlanList, PlanItem } from "~/db/plan";

export default component$(() => {
  const loc = useLocation();
  const listId = parseInt(loc.params.listId, 10);
  const list = useSignal<PlanList | null>(null);
  const items = useSignal<PlanItem[]>([]);
  const isLoaded = useSignal(false);
  const activeItemId = useSignal<number | null>(null);
  const formMode = useSignal<"none" | "add" | "edit">("none");
  const editingItem = useSignal<PlanItem | null>(null);
  const formAnimating = useSignal(false);

  // Form fields
  const formName = useSignal("");
  const formDescription = useSignal("");
  const formAmount = useSignal(1);

  // Double-click confirmation signals
  const removeAllConfirm = useSignal(false);
  const removeAllTimer = useSignal<number | null>(null);
  const itemConfirm = useSignal<number | null>(null);
  const itemTimers = useSignal<Map<number, number>>(new Map());

  useVisibleTask$(async ({ track }) => {
    track(() => loc.params.listId);

    // Skip if listId is not a valid number
    const id = parseInt(loc.params.listId, 10);
    if (isNaN(id)) {
      isLoaded.value = true;
      return;
    }

    try {
      const response = await fetch(`/api/plan/lists/${id}`);
      if (response.ok) {
        const data = await response.json();
        list.value = data.list;
        items.value = data.items;
      } else {
        console.error("API error:", response.status, response.statusText);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
    isLoaded.value = true;
  });

  const refreshItems = $(async () => {
    const response = await fetch(`/api/plan/lists/${listId}`);
    if (response.ok) {
      const data = await response.json();
      items.value = data.items;
    }
  });

  const handleItemClick = $((itemId: number) => {
    if (activeItemId.value === itemId) {
      activeItemId.value = null;
    } else {
      activeItemId.value = itemId;
    }
  });

  const handleAmountChange = $(async (itemId: number, delta: number) => {
    const item = items.value.find((i) => i.id === itemId);
    if (!item) return;

    const newAmount = item.amount + delta;
    if (newAmount < 1) return;

    await fetch(`/api/plan/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: newAmount }),
    });

    await refreshItems();
  });

  const handleRemove = $(async (itemId: number) => {
    if (itemConfirm.value !== itemId) {
      // First click - show confirmation
      itemConfirm.value = itemId;
      const timer = window.setTimeout(() => {
        itemConfirm.value = null;
      }, 2000);
      const timers = itemTimers.value;
      timers.set(itemId, timer);
      itemTimers.value = new Map(timers);
      return;
    }

    // Second click within timeout - execute
    const timers = itemTimers.value;
    const timer = timers.get(itemId);
    if (timer) {
      window.clearTimeout(timer);
      timers.delete(itemId);
      itemTimers.value = new Map(timers);
    }
    itemConfirm.value = null;

    await fetch(`/api/plan/items/${itemId}`, {
      method: "DELETE",
    });
    activeItemId.value = null;
    await refreshItems();
  });

  const handleRemoveAll = $(async () => {
    if (!removeAllConfirm.value) {
      // First click - show confirmation
      removeAllConfirm.value = true;
      const timer = window.setTimeout(() => {
        removeAllConfirm.value = false;
      }, 2000);
      removeAllTimer.value = timer;
      return;
    }

    // Second click within timeout - execute
    if (removeAllTimer.value) {
      window.clearTimeout(removeAllTimer.value);
      removeAllTimer.value = null;
    }
    removeAllConfirm.value = false;

    await fetch(`/api/plan/lists/${listId}/items`, {
      method: "DELETE",
    });
    await refreshItems();
  });

  const handleAddClick = $(() => {
    formMode.value = "add";
    formName.value = "";
    formDescription.value = "";
    formAmount.value = 1;
    formAnimating.value = true;
  });

  const handleEditClick = $((item: PlanItem) => {
    formMode.value = "edit";
    editingItem.value = item;
    formName.value = item.name;
    formDescription.value = item.description || "";
    formAmount.value = item.amount;
    formAnimating.value = true;
  });

  const handleSave = $(async () => {
    if (formMode.value === "add") {
      await fetch(`/api/plan/lists/${listId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.value,
          description: formDescription.value || undefined,
          amount: formAmount.value,
        }),
      });
    } else if (formMode.value === "edit" && editingItem.value) {
      await fetch(`/api/plan/items/${editingItem.value.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.value,
          description: formDescription.value || null,
          amount: formAmount.value,
        }),
      });
    }
    formMode.value = "none";
    editingItem.value = null;
    formAnimating.value = false;
    activeItemId.value = null;
    await refreshItems();
  });

  const handleCancel = $(() => {
    formMode.value = "none";
    editingItem.value = null;
    formAnimating.value = false;
  });

  // Cleanup timers on unmount
  useVisibleTask$(() => {
    return () => {
      if (removeAllTimer.value) {
        window.clearTimeout(removeAllTimer.value);
      }
      itemTimers.value.forEach((timer) => window.clearTimeout(timer));
    };
  });

  if (!isLoaded.value) {
    return <div class="p-4">Loading...</div>;
  }

  if (!list.value) {
    return <div class="p-4">List not found</div>;
  }

  return (
    <div class="relative min-h-screen overflow-hidden" data-testid="plan-items-container">
      {/* List View */}
      <div
        class={`min-h-screen p-4 transition-transform duration-300 ease-in-out ${
          formMode.value === "none" ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ willChange: "transform" }}
      >
        <div class="flex items-center mb-4">
          <Link
            href="/plan/lists"
            class="flex items-center text-gray-500 hover:text-gray-700"
          >
            <HiArrowLeftOutline class="w-5 h-5 mr-1" />
            <span>Back</span>
          </Link>
        </div>

        <h1 class="text-xl font-bold text-gray-800 mb-4">{list.value.title}</h1>

        <div class="flex space-x-2 mb-4">
          <button
            onClick$={handleAddClick}
            class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <HiPlusOutline class="w-5 h-5 mr-1" />
            <span>Add new</span>
          </button>
          <button
            onClick$={handleRemoveAll}
            disabled={items.value.length === 0 && !removeAllConfirm.value}
            class={`flex items-center px-3 py-2 rounded ${
              removeAllConfirm.value
                ? "bg-green-500 text-white animate-bounce"
                : items.value.length === 0
                ? "bg-gray-200 text-gray-400"
                : "bg-red-500 text-white hover:bg-red-600"
            }`}
            aria-label="Remove all"
          >
            {removeAllConfirm.value ? (
              <HiCheckCircleSolid class="w-5 h-5 mr-1" />
            ) : (
              <HiTrashOutline class="w-5 h-5 mr-1" />
            )}
            <span>Remove all</span>
          </button>
        </div>

        {items.value.length === 0 ? (
          <p class="text-lg text-gray-500">No items yet</p>
        ) : (
          <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
            <ul class="space-y-2">
              {items.value.map((item) => (
                <li
                  key={item.id}
                  class={`p-3 border rounded cursor-pointer ${
                    activeItemId.value === item.id ? "bg-blue-50 border-blue-300" : "bg-white"
                  }`}
                  onClick$={() => handleItemClick(item.id)}
                >
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center">
                        <span class="text-gray-800 font-medium">{item.name}</span>
                        <span class="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-sm rounded">
                          x{item.amount}
                        </span>
                      </div>
                      {item.description && (
                        <p class="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}
                    </div>

                    {activeItemId.value === item.id && (
                      <div class="flex items-center space-x-1 ml-2" onClick$={(e) => e.stopPropagation()}>
                        <button
                          onClick$={() => handleAmountChange(item.id, -1)}
                          disabled={item.amount <= 1}
                          class={`p-1 ${item.amount <= 1 ? "text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                          aria-label="Decrease amount"
                        >
                          <HiMinusOutline class="w-5 h-5" />
                        </button>
                        <button
                          onClick$={() => handleAmountChange(item.id, 1)}
                          class="p-1 text-gray-500 hover:text-gray-700"
                          aria-label="Increase amount"
                        >
                          <HiPlusSolid class="w-5 h-5" />
                        </button>
                        <button
                          onClick$={() => handleEditClick(item)}
                          class="p-1 text-blue-500 hover:text-blue-700"
                          aria-label="Edit"
                        >
                          <HiPencilOutline class="w-5 h-5" />
                        </button>
                        <button
                          onClick$={() => handleRemove(item.id)}
                          class={`p-1 ${itemConfirm.value === item.id ? "text-green-500 animate-bounce" : "text-red-500 hover:text-red-700"}`}
                          aria-label="Remove"
                        >
                          {itemConfirm.value === item.id ? (
                            <HiCheckCircleSolid class="w-5 h-5" />
                          ) : (
                            <HiTrashOutline class="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Form View */}
      <div
        class={`absolute top-0 left-0 w-full min-h-screen p-4 bg-white transition-transform duration-300 ease-in-out ${
          formMode.value !== "none" ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform" }}
      >
        <h1 class="text-xl font-bold text-gray-800 mb-4">
          {formMode.value === "add" ? "Add Item" : "Edit Item"}
        </h1>

        <div
          class="space-y-4"
          data-testid={formMode.value === "add" ? "edit-form-add" : "edit-form-edit"}
        >
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formName.value}
              onInput$={(e) => (formName.value = (e.target as HTMLInputElement).value)}
              maxLength={100}
              class="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formDescription.value}
              onInput$={(e) => (formDescription.value = (e.target as HTMLTextAreaElement).value)}
              maxLength={300}
              rows={3}
              class="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={formAmount.value}
              onInput$={(e) => (formAmount.value = parseInt((e.target as HTMLInputElement).value, 10) || 1)}
              min={1}
              class="w-full px-3 py-2 border rounded"
            />
          </div>

          <div class="flex space-x-2">
            <button
              onClick$={handleSave}
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
            <button
              onClick$={handleCancel}
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
