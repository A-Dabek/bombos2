import { component$, useSignal, useVisibleTask$, $, useContext } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import type { GroceryItem } from "~/db/groceries";
import type { Aisle } from "~/db/shops";
import AisleFilter, { type AisleFilterOption } from "./AisleFilter";
import ShoppingAisleGroup from "./ShoppingAisleGroup";
import { RefreshContext } from "~/constants/refresh";

interface AisleGroup {
  key: string;
  aisleId: number | null;
  label: string;
  items: GroceryItem[];
}

export default component$(() => {
  const items = useSignal<GroceryItem[]>([]);
  const aisles = useSignal<Aisle[]>([]);
  const activeShopId = useSignal<number | null>(null);
  const manuallyCompletedAisles = useSignal<number[]>([]);
  const isLoading = useSignal(true);
  const selected = useSignal("All");
  const lastBoughtId = useSignal<number | null>(null);
  const promptItem = useSignal<GroceryItem | null>(null);
  const refreshSignal = useContext(RefreshContext);

  const fetchItems = $(async () => {
    isLoading.value = true;
    try {
      const settingsResp = await fetch("/api/settings");
      let shopId: number | null = null;
      if (settingsResp.ok) {
        const settings = await settingsResp.json();
        shopId = settings.activeShop ?? null;
      }
      activeShopId.value = shopId;

      if (shopId === null) {
        items.value = [];
        aisles.value = [];
        manuallyCompletedAisles.value = [];
        return;
      }

      const [resp, compResp, aislesResp] = await Promise.all([
        fetch(`/api/groceries?shop=${shopId}`),
        fetch(`/api/groceries/completed-aisles?shop=${shopId}`),
        fetch(`/api/shops/${shopId}/aisles`),
      ]);

      if (resp.ok) {
        items.value = await resp.json();
      }
      if (compResp.ok) {
        manuallyCompletedAisles.value = await compResp.json();
      }
      if (aislesResp.ok) {
        const data = await aislesResp.json();
        aisles.value = data.aisles;
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

  const setBought = $(
    async (item: GroceryItem, bought: boolean, aisleId: number | null) => {
      try {
        const body: Record<string, unknown> = { bought };
        if (aisleId !== null) {
          body.shopId = activeShopId.value;
          body.aisleId = aisleId;
          body.aisleManual = true;
        }
        const response = await fetch(`/api/groceries/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          items.value = items.value.map((i) =>
            i.id === item.id
              ? { ...i, bought, aisleId: aisleId !== null ? aisleId : i.aisleId }
              : i,
          );
          if (bought) {
            lastBoughtId.value = item.id;
          } else if (lastBoughtId.value === item.id) {
            lastBoughtId.value = null;
          }
        }
      } catch (error) {
        console.error("Failed to toggle bought status:", error);
      }
    },
  );

  const handleToggleBought = $((item: GroceryItem) => {
    if (!item.bought && item.aisleId == null && activeShopId.value !== null) {
      promptItem.value = item;
      return;
    }
    setBought(item, !item.bought, null);
  });

  const handlePickAisle = $((aisleId: number) => {
    const item = promptItem.value;
    if (!item) return;
    promptItem.value = null;
    setBought(item, true, aisleId);
  });

  const handleSkipPrompt = $(() => {
    const item = promptItem.value;
    if (!item) return;
    promptItem.value = null;
    setBought(item, true, null);
  });

  const handleToggleAisleCompleted = $(async (keyValue: string) => {
    const aisleId = Number(keyValue.replace("aisle-", ""));
    if (!Number.isInteger(aisleId) || activeShopId.value === null) return;
    const isCompleted = manuallyCompletedAisles.value.includes(aisleId);
    try {
      const response = await fetch("/api/groceries/completed-aisles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: activeShopId.value,
          aisleId,
          completed: !isCompleted,
        }),
      });

      if (response.ok) {
        if (isCompleted) {
          manuallyCompletedAisles.value = manuallyCompletedAisles.value.filter(
            (id) => id !== aisleId,
          );
        } else {
          manuallyCompletedAisles.value = [...manuallyCompletedAisles.value, aisleId];
        }
      }
    } catch (error) {
      console.error("Failed to toggle aisle completed status:", error);
    }
  });

  const allItemsBought = items.value.length > 0 && items.value.every((i) => i.bought);

  const groups: AisleGroup[] = (() => {
    const unassigned: GroceryItem[] = [];
    const byAisle = new Map<number, GroceryItem[]>();
    const knownAisles = new Set(aisles.value.map((a) => a.id));
    for (const item of items.value) {
      if (item.aisleId == null || !knownAisles.has(item.aisleId)) {
        unassigned.push(item);
      } else {
        const list = byAisle.get(item.aisleId) ?? [];
        list.push(item);
        byAisle.set(item.aisleId, list);
      }
    }

    const result: AisleGroup[] = [];
    for (const aisle of aisles.value) {
      const list = byAisle.get(aisle.id);
      if (list && list.length > 0) {
        result.push({
          key: `aisle-${aisle.id}`,
          aisleId: aisle.id,
          label: aisle.name,
          items: list,
        });
      }
    }
    if (unassigned.length > 0) {
      result.push({
        key: "unassigned",
        aisleId: null,
        label: "Bez alejki",
        items: unassigned,
      });
    }
    return result;
  })();

  const isGroupDone = (group: AisleGroup): boolean =>
    (group.aisleId !== null &&
      manuallyCompletedAisles.value.includes(group.aisleId)) ||
    (group.items.length > 0 && group.items.every((i) => i.bought));

  const options: AisleFilterOption[] = [
    { value: "All", label: "Wszystkie", completed: allItemsBought },
    ...groups.map((group) => ({
      value: group.key,
      label: group.label,
      completed: isGroupDone(group),
    })),
  ].sort((a, b) => {
    if (a.value === "All") return -1;
    if (b.value === "All") return 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return 0;
  });

  const visibleGroups =
    selected.value === "All"
      ? [...groups].sort((a, b) => {
          const aDone = isGroupDone(a);
          const bDone = isGroupDone(b);
          if (aDone !== bDone) return aDone ? 1 : -1;
          if (a.aisleId === null) return 1;
          if (b.aisleId === null) return -1;
          return 0;
        })
      : groups.filter((group) => group.key === selected.value);

  return (
    <div class="p-4">
      {isLoading.value ? (
        <div class="flex justify-center py-4">
          <Loader size="sm" color="border-blue-500" />
        </div>
      ) : (
        <>
          {items.value.length === 0 ? (
            <p class="text-lg text-gray-500 dark:text-gray-400" data-testid="empty-state">
              Brak pozycji
            </p>
          ) : (
            <>
              <AisleFilter
                options={options}
                selected={selected.value}
                onSelect$={(value) => (selected.value = value)}
              />

              <div class="space-y-6">
                {visibleGroups.map((group) => (
                  <ShoppingAisleGroup
                    key={group.key}
                    keyValue={group.key}
                    label={group.label}
                    items={group.items}
                    showHeading={true}
                    lastBoughtId={lastBoughtId.value}
                    isCompleted={isGroupDone(group)}
                    isManuallyCompleted={
                      group.aisleId !== null &&
                      manuallyCompletedAisles.value.includes(group.aisleId)
                    }
                    onToggle$={handleToggleBought}
                    onToggleAisleCompleted$={handleToggleAisleCompleted}
                  />
                ))}
                {selected.value === "All" &&
                  visibleGroups.length > 0 &&
                  visibleGroups.every((group) => isGroupDone(group)) && (
                    <p class="text-center text-gray-500 dark:text-gray-400 py-8">
                      Wszystkie alejki są skończone
                    </p>
                  )}
              </div>
            </>
          )}
        </>
      )}

      {promptItem.value && (
        <div
          class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          data-testid="find-aisle-prompt"
        >
          <div class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 space-y-3">
            <h3 class="text-base font-bold text-gray-800 dark:text-gray-100">
              Gdzie to znalazłeś?
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {promptItem.value.name}
            </p>
            <div class="flex flex-wrap gap-2">
              {aisles.value.map((aisle) => (
                <button
                  key={aisle.id}
                  onClick$={() => handlePickAisle(aisle.id)}
                  data-testid={`find-aisle-${aisle.id}`}
                  class="px-3 py-1.5 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600"
                >
                  {aisle.name}
                </button>
              ))}
            </div>
            <div class="flex justify-between pt-1">
              <button
                onClick$={() => (promptItem.value = null)}
                data-testid="find-aisle-cancel"
                class="px-3 py-1.5 text-gray-500 dark:text-gray-400 text-sm"
              >
                Anuluj
              </button>
              <button
                onClick$={handleSkipPrompt}
                data-testid="find-aisle-skip"
                class="px-3 py-1.5 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded text-sm"
              >
                Pomiń
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
