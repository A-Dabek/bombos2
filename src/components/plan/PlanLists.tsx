import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import Ping from "~/components/shared/Ping";
import { HiChevronDownOutline } from "@qwikest/icons/heroicons";
import type { PlanList, PlanItem } from "~/db/plan";
import AdminButton from "~/components/shared/AdminButton";
import PlanAccordionList from "./PlanAccordionList";

export default component$(() => {
  const lists = useSignal<PlanList[]>([]);
  const isLoaded = useSignal(false);
  const expandedListId = useSignal<number | null>(null);
  const listItemsCache = useSignal<
    Map<number, { list: PlanList; items: PlanItem[] }>
  >(new Map());
  const loadingListId = useSignal<number | null>(null);

  // Form state
  const formMode = useSignal<"none" | "add" | "edit">("none");
  const editingItem = useSignal<PlanItem | null>(null);

  // Item interaction state
  const activeItemId = useSignal<number | null>(null);

  const fetchLists = $(async () => {
    try {
      const response = await fetch("/api/plan/lists");
      if (response.ok) {
        lists.value = await response.json();
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  });

  // Load lists on mount
  useVisibleTask$(async () => {
    await fetchLists();
    isLoaded.value = true;
  });

  // Cleanup timers on unmount
  useVisibleTask$(() => {
    return () => {
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
    await Promise.all([loadListItems(listId), fetchLists()]);
  });

  const handleItemClick = $((itemId: number) => {
    activeItemId.value = activeItemId.value === itemId ? null : itemId;
  });

  const handleAmountChange = $(
    async (listId: number, itemId: number, delta: number) => {
      // Removed - amount functionality no longer exists
    },
  );

  const handleRemove = $(async (listId: number, itemId: number) => {
    await fetch(`/api/plan/items/${itemId}`, { method: "DELETE" });
    activeItemId.value = null;
    await refreshItems(listId);
  });

  const handleRemoveAll = $(async (listId: number) => {
    await fetch(`/api/plan/lists/${listId}/items`, { method: "DELETE" });
    await refreshItems(listId);
  });

  const handleAddClick = $((listId: number) => {
    formMode.value = "add";
  });

  const handleEditClick = $((listId: number, item: PlanItem) => {
    formMode.value = "edit";
    editingItem.value = item;
  });

  const handleSave = $(
    async (
      listId: number,
      name: string,
      description: string,
      urgent: boolean,
    ) => {
      if (formMode.value === "add") {
        await fetch(`/api/plan/lists/${listId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: description || undefined,
            urgent,
          }),
        });
      } else if (formMode.value === "edit" && editingItem.value) {
        await fetch(`/api/plan/items/${editingItem.value.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: description || null,
            urgent,
          }),
        });
      }
      formMode.value = "none";
      editingItem.value = null;
      activeItemId.value = null;
      await refreshItems(listId);
    },
  );

  const handleNext = $(
    async (
      listId: number,
      name: string,
      description: string,
      urgent: boolean,
    ) => {
      await fetch(`/api/plan/lists/${listId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          urgent,
        }),
      });
      await refreshItems(listId);
    },
  );

  const handleCancel = $(() => {
    formMode.value = "none";
    editingItem.value = null;
  });

  return (
    <div class="min-h-screen pb-[100vh]" data-testid="plan-lists">
      {!isLoaded.value ? (
        <div class="flex justify-center p-8">
          <Loader />
        </div>
      ) : lists.value.length === 0 ? (
        <p class="text-lg text-gray-500 px-4">Brak list</p>
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
                    <span class="text-lg text-gray-800 font-medium flex items-center">
                      {list.title}
                      {list.hasUrgent && <Ping class="relative ml-2 inline-flex h-2 w-2" data-testid="plan-list-urgent-dot" />}
                    </span>
                    <HiChevronDownOutline
                      class={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {cachedData && (
                    <PlanAccordionList
                      listId={list.id}
                      isExpanded={isExpanded}
                      items={cachedData.items}
                      isLoading={isLoading}
                      formMode={isExpanded ? formMode.value : "none"}
                      activeItemId={activeItemId.value}
                      onItemClick$={handleItemClick}
                      onEditClick$={(item) => handleEditClick(list.id, item)}
                      onRemove$={(itemId) => handleRemove(list.id, itemId)}
                      onAddClick$={() => handleAddClick(list.id)}
                      onRemoveAll$={() => handleRemoveAll(list.id)}
                      onSave$={(name, desc, urgent) =>
                        handleSave(list.id, name, desc, urgent)
                      }
                      onNext$={(name, desc, urgent) =>
                        handleNext(list.id, name, desc, urgent)
                      }
                      onCancel$={handleCancel}
                      editingItem={isExpanded ? editingItem.value : null}
                    />
                  )}
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
