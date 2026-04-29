import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { HiPlusOutline, HiTrashOutline, HiPencilOutline, HiMinusOutline, HiPlusSolid, HiCheckCircleSolid, HiChevronDownOutline } from "@qwikest/icons/heroicons";
import type { PlanList, PlanItem } from "~/db/plan";
import AdminButton from "~/components/shared/AdminButton";

export default component$(() => {
  const lists = useSignal<PlanList[]>([]);
  const isLoaded = useSignal(false);
  const expandedListId = useSignal<number | null>(null);
  const listItemsCache = useSignal<Map<number, { list: PlanList; items: PlanItem[] }>>(new Map());
  const loadingListId = useSignal<number | null>(null);

  const formMode = useSignal<"none" | "add" | "edit">("none");
  const editingItem = useSignal<PlanItem | null>(null);
  const formName = useSignal("");
  const formDescription = useSignal("");
  const formAmount = useSignal(1);

  const activeItemId = useSignal<number | null>(null);

  const removeAllConfirm = useSignal(false);
  const removeAllTimer = useSignal<number | null>(null);
  const itemConfirm = useSignal<number | null>(null);
  const itemTimers = useSignal<Map<number, number>>(new Map());

  useVisibleTask$(async () => {
    try {
      const response = await fetch("/api/plan/lists");
      if (response.ok) {
        lists.value = await response.json();
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
    isLoaded.value = true;
  });

  useVisibleTask$(() => {
    return () => {
      if (removeAllTimer.value) window.clearTimeout(removeAllTimer.value);
      itemTimers.value.forEach((timer) => window.clearTimeout(timer));
      listItemsCache.value = new Map();
    };
  });

  const loadListItems = $(async (listId: number) => {
    if (listItemsCache.value.has(listId)) return;
    loadingListId.value = listId;
    try {
      const response = await fetch(`/api/plan/lists/${listId}`);
      if (response.ok) {
        const data = await response.json();
        const newCache = new Map(listItemsCache.value);
        newCache.set(listId, { list: data.list, items: data.items });
        listItemsCache.value = newCache;
      }
    } catch (e) {
      console.error("Failed to load list items:", e);
    } finally {
      loadingListId.value = null;
    }
  });

  const handleListClick = $((listId: number) => {
    if (expandedListId.value === listId) {
      expandedListId.value = null;
      formMode.value = "none";
      activeItemId.value = null;
    } else {
      expandedListId.value = listId;
      formMode.value = "none";
      activeItemId.value = null;
      loadListItems(listId);
    }
  });

  const refreshItems = $(async (listId: number) => {
    const newCache = new Map(listItemsCache.value);
    newCache.delete(listId);
    listItemsCache.value = newCache;
    await loadListItems(listId);
  });

  const handleItemClick = $((itemId: number) => {
    activeItemId.value = activeItemId.value === itemId ? null : itemId;
  });

  const handleAmountChange = $(async (listId: number, itemId: number, delta: number) => {
    const cached = listItemsCache.value.get(listId);
    if (!cached) return;
    const item = cached.items.find((i) => i.id === itemId);
    if (!item) return;
    const newAmount = item.amount + delta;
    if (newAmount < 1) return;
    await fetch(`/api/plan/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: newAmount }),
    });
    await refreshItems(listId);
  });

  const handleRemove = $(async (listId: number, itemId: number) => {
    if (itemConfirm.value !== itemId) {
      itemConfirm.value = itemId;
      const timer = window.setTimeout(() => { itemConfirm.value = null; }, 2000);
      const timers = new Map(itemTimers.value);
      timers.set(itemId, timer);
      itemTimers.value = timers;
      return;
    }
    const timers = new Map(itemTimers.value);
    const timer = timers.get(itemId);
    if (timer) { window.clearTimeout(timer); timers.delete(itemId); }
    itemTimers.value = timers;
    itemConfirm.value = null;
    await fetch(`/api/plan/items/${itemId}`, { method: "DELETE" });
    activeItemId.value = null;
    await refreshItems(listId);
  });

  const handleRemoveAll = $(async (listId: number) => {
    if (!removeAllConfirm.value) {
      removeAllConfirm.value = true;
      const timer = window.setTimeout(() => { removeAllConfirm.value = false; }, 2000);
      removeAllTimer.value = timer;
      return;
    }
    if (removeAllTimer.value) { window.clearTimeout(removeAllTimer.value); removeAllTimer.value = null; }
    removeAllConfirm.value = false;
    await fetch(`/api/plan/lists/${listId}/items`, { method: "DELETE" });
    await refreshItems(listId);
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

  const handleSave = $(async (listId: number) => {
    if (formMode.value === "add") {
      await fetch(`/api/plan/lists/${listId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.value, description: formDescription.value || undefined, amount: formAmount.value }),
      });
    } else if (formMode.value === "edit" && editingItem.value) {
      await fetch(`/api/plan/items/${editingItem.value.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.value, description: formDescription.value || null, amount: formAmount.value }),
      });
    }
    formMode.value = "none";
    editingItem.value = null;
    activeItemId.value = null;
    await refreshItems(listId);
  });

  const handleCancel = $(() => {
    formMode.value = "none";
    editingItem.value = null;
  });

  return (
    <div class="min-h-screen" data-testid="plan-lists">
      {isLoaded.value && lists.value.length === 0 ? (
        <p class="text-lg text-gray-500 px-4">No lists yet</p>
      ) : (
        <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
          <ul class="divide-y divide-gray-200">
            {lists.value.map((list) => {
              const isExpanded = expandedListId.value === list.id;
              const cachedData = listItemsCache.value.get(list.id);
              const isLoading = loadingListId.value === list.id;

              return (
                <li key={list.id} class="border-b border-gray-200">
                  <button
                    onClick$={() => handleListClick(list.id)}
                    class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 text-left"
                  >
                    <span class="text-lg text-gray-800 font-medium">{list.title}</span>
                    <HiChevronDownOutline class={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Accordion body with max-height animation */}
                  <div
                    class={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
                      isExpanded ? "max-h-[1000px]" : "max-h-0"
                    }`}
                  >
                    <div class="relative" style="min-height: 100px;">
                      {/* Items View */}
                      <div class={`transition-transform duration-300 ease-in-out ${formMode.value === "none" ? "translate-x-0" : "-translate-x-full"}`}>
                        <div class="p-4">
                          {isLoading ? (
                            <div class="flex justify-center py-4">
                              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            </div>
                          ) : cachedData ? (
                            <>
                              <div class="flex space-x-2 mb-4">
                                <button onClick$={handleAddClick} class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                  <HiPlusOutline class="w-5 h-5 mr-1" /><span>Add new</span>
                                </button>
                                <button
                                  onClick$={() => handleRemoveAll(list.id)}
                                  disabled={cachedData.items.length === 0 && !removeAllConfirm.value}
                                  class={`flex items-center px-3 py-2 rounded ${
                                    removeAllConfirm.value ? "bg-green-500 text-white animate-bounce" :
                                    cachedData.items.length === 0 ? "bg-gray-200 text-gray-400" :
                                    "bg-red-500 text-white hover:bg-red-600"
                                  }`}
                                  aria-label="Remove all"
                                  data-testid="remove-all-btn"
                                >
                                  {removeAllConfirm.value ? <HiCheckCircleSolid class="w-5 h-5 mr-1" /> : <HiTrashOutline class="w-5 h-5 mr-1" />}
                                  <span>Remove all</span>
                                </button>
                              </div>

                              {cachedData.items.length === 0 ? (
                                <p class="text-lg text-gray-500">No items yet</p>
                              ) : (
                                <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
                                  <ul class="space-y-2">
                                    {cachedData.items.map((item) => (
                                      <li
                                        key={item.id}
                                        class={`p-3 border rounded cursor-pointer ${activeItemId.value === item.id ? "bg-blue-50 border-blue-300" : "bg-white"}`}
                                        onClick$={() => handleItemClick(item.id)}
                                      >
                                        <div class="flex items-start justify-between">
                                          <div class="flex-1">
                                            <div class="flex items-center">
                                              <span class="text-gray-800 font-medium">{item.name}</span>
                                              <span class="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-sm rounded">x{item.amount}</span>
                                            </div>
                                            {item.description && <p class="text-sm text-gray-600 mt-1">{item.description}</p>}
                                          </div>
                                          {activeItemId.value === item.id && (
                                            <div class="flex items-center space-x-1 ml-2" onClick$={(e) => e.stopPropagation()}>
                                              <button onClick$={() => handleAmountChange(list.id, item.id, -1)} disabled={item.amount <= 1}
                                                class={`p-1 ${item.amount <= 1 ? "text-gray-300" : "text-gray-500 hover:text-gray-700"}`} aria-label="Decrease amount">
                                                <HiMinusOutline class="w-5 h-5" />
                                              </button>
                                              <button onClick$={() => handleAmountChange(list.id, item.id, 1)} class="p-1 text-gray-500 hover:text-gray-700" aria-label="Increase amount">
                                                <HiPlusSolid class="w-5 h-5" />
                                              </button>
                                              <button onClick$={() => handleEditClick(item)} class="p-1 text-blue-500 hover:text-blue-700" aria-label="Edit">
                                                <HiPencilOutline class="w-5 h-5" />
                                              </button>
                                              <button onClick$={() => handleRemove(list.id, item.id)}
                                                class={`p-1 ${itemConfirm.value === item.id ? "text-green-500 animate-bounce" : "text-red-500 hover:text-red-700"}`}
                                                aria-label="Remove" data-testid="item-remove-btn">
                                                {itemConfirm.value === item.id ? <HiCheckCircleSolid class="w-5 h-5" /> : <HiTrashOutline class="w-5 h-5" />}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Form View - slides in from right */}
                      <div class={`absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out bg-white ${formMode.value !== "none" ? "translate-x-0" : "translate-x-full"}`}>
                        <div class="p-4">
                          <h2 class="text-xl font-bold text-gray-800 mb-4">
                            {formMode.value === "add" ? "Add Item" : "Edit Item"}
                          </h2>
                          <div class="space-y-4" data-testid={formMode.value === "add" ? "edit-form-add" : "edit-form-edit"}>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                              <input type="text" value={formName.value}
                                onInput$={(e) => (formName.value = (e.target as HTMLInputElement).value)}
                                maxLength={100} class="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                              <textarea value={formDescription.value}
                                onInput$={(e) => (formDescription.value = (e.target as HTMLTextAreaElement).value)}
                                maxLength={300} rows={3} class="w-full px-3 py-2 border rounded" />
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                              <input type="number" value={formAmount.value}
                                onInput$={(e) => (formAmount.value = parseInt((e.target as HTMLInputElement).value, 10) || 1)}
                                min={1} class="w-full px-3 py-2 border rounded" />
                            </div>
                            <div class="flex space-x-2">
                              <button onClick$={() => handleSave(list.id)} class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Save</button>
                              <button onClick$={handleCancel} class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400">Cancel</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <AdminButton href="/plan/admin" />
    </div>
  );
});
