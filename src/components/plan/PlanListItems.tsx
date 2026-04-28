import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { HiArrowLeftOutline, HiPlusOutline, HiTrashOutline, HiPencilOutline, HiMinusOutline, HiPlusSolid } from "@qwikest/icons/heroicons";
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

  // Form fields
  const formName = useSignal("");
  const formDescription = useSignal("");
  const formAmount = useSignal(1);

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
    await fetch(`/api/plan/items/${itemId}`, {
      method: "DELETE",
    });
    activeItemId.value = null;
    await refreshItems();
  });

  const handleRemoveAll = $(async () => {
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
  });

  const handleEditClick = $((item: PlanItem) => {
    formMode.value = "edit";
    editingItem.value = item;
    formName.value = item.name;
    formDescription.value = item.description || "";
    formAmount.value = item.amount;
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
    activeItemId.value = null;
    await refreshItems();
  });

  const handleCancel = $(() => {
    formMode.value = "none";
    editingItem.value = null;
  });

  if (!isLoaded.value) {
    return <div class="p-4">Loading...</div>;
  }

  if (!list.value) {
    return <div class="p-4">List not found</div>;
  }

  // Form mode - show form instead of list
  if (formMode.value !== "none") {
    return (
      <div class="min-h-screen p-4" data-testid="edit-form">
        <div class="flex items-center mb-4">
          <Link
            href="/plan/lists"
            class="flex items-center text-gray-500 hover:text-gray-700"
          >
            <HiArrowLeftOutline class="w-5 h-5 mr-1" />
            <span>Back</span>
          </Link>
        </div>

        <h1 class="text-xl font-bold text-gray-800 mb-4">
          {formMode.value === "add" ? "Add Item" : "Edit Item"}
        </h1>

        <div class="space-y-4">
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
    );
  }

  // Normal mode - show list
  return (
    <div class="min-h-screen p-4" data-testid="plan-items">
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
          disabled={items.value.length === 0}
          class={`flex items-center px-3 py-2 rounded ${
            items.value.length === 0
              ? "bg-gray-200 text-gray-400"
              : "bg-red-500 text-white hover:bg-red-600"
          }`}
        >
          <HiTrashOutline class="w-5 h-5 mr-1" />
          <span>Remove all</span>
        </button>
      </div>

      {items.value.length === 0 ? (
        <p class="text-lg text-gray-500">No items yet</p>
      ) : (
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
                      class="p-1 text-red-500 hover:text-red-700"
                      aria-label="Remove"
                    >
                      <HiTrashOutline class="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});