import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import BackButton from "~/components/shared/BackButton";
import TextInput from "~/components/shared/TextInput";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import { HiPlusOutline, HiArrowUpOutline, HiArrowDownOutline } from "@qwikest/icons/heroicons";
import type { PlanList } from "~/db/plan";

export default component$(() => {
  const lists = useSignal<PlanList[]>([]);
  const newListTitle = useSignal("");
  const isLoaded = useSignal(false);

  useVisibleTask$(async () => {
    try {
      const response = await fetch("/api/plan/lists");
      if (response.ok) {
        const data = await response.json();
        lists.value = data;
      } else {
        console.error("API error:", response.status);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
    isLoaded.value = true;
  });

  const handleAdd = $(async () => {
    const title = newListTitle.value.trim();
    if (!title) return;

    const displayOrder = lists.value.length;
    const response = await fetch("/api/plan/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, display_order: displayOrder }),
    });

    if (response.ok) {
      const result = await response.json();
      lists.value = [
        ...lists.value,
        { id: result.id, title, display_order: displayOrder, created_at: Date.now() },
      ];
      newListTitle.value = "";
    }
  });

  const handleMove = $(async (id: number, direction: "up" | "down") => {
    const response = await fetch(`/api/plan/lists/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    });

    if (response.ok) {
      // Refetch lists to get updated order
      const fetchResponse = await fetch("/api/plan/lists");
      const data = await fetchResponse.json();
      lists.value = data;
    }
  });

  const handleDelete = $(async (id: number) => {
    const response = await fetch(`/api/plan/lists/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      lists.value = lists.value.filter((l) => l.id !== id);
    }
  });

  // Cleanup timers on unmount
  useVisibleTask$(() => {
    // No longer needed here, handled by DoubleConfirmButton
  });

  return (
    <div class="min-h-screen p-4" data-testid="plan-admin">
       <BackButton href="/plan/lists" />

      <h1 class="text-xl font-bold text-gray-800 mb-4">Zarządzaj listami</h1>

      <div class="flex items-center mb-4 space-x-2">
        <TextInput
          type="text"
          value={newListTitle.value}
          onInput$={(e) => (newListTitle.value = (e.target as HTMLInputElement).value)}
          placeholder="Tytuł nowej listy..."
          class="flex-1"
          containerClass="flex-1"
        />
        <button
          onClick$={handleAdd}
          data-testid="plan-add-list-btn"
          class="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <HiPlusOutline class="w-5 h-5 mr-1" />
          <span>Dodaj listę</span>
        </button>
      </div>

      {!isLoaded.value ? (
        <div class="flex justify-center p-8">
          <Loader />
        </div>
      ) : lists.value.length === 0 ? (
        <p class="text-lg text-gray-500">Brak list</p>
      ) : (
        <ul class="space-y-2">
          {lists.value.map((list, index) => (
            <li
              key={list.id}
              class="flex items-center justify-between p-3 bg-white border rounded"
            >
              <span class="text-gray-800 flex-1">{list.title}</span>
              <div class="flex items-center space-x-1">
                <button
                  onClick$={() => handleMove(list.id, "up")}
                  disabled={index === 0}
                  class={`p-1 ${index === 0 ? "text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                  aria-label="Przenieś w górę"
                >
                  <HiArrowUpOutline class="w-5 h-5" />
                </button>
                <button
                  onClick$={() => handleMove(list.id, "down")}
                  disabled={index === lists.value.length - 1}
                  class={`p-1 ${index === lists.value.length - 1 ? "text-gray-300" : "text-gray-500 hover:text-gray-700"}`}
                  aria-label="Przenieś w dół"
                >
                  <HiArrowDownOutline class="w-5 h-5" />
                </button>
                <DoubleConfirmButton
                  onConfirm$={() => handleDelete(list.id)}
                  class="p-1"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
