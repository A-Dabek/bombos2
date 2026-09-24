import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import TextInput from "~/components/shared/TextInput";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import {
  HiChevronUpOutline,
  HiChevronDownOutline,
  HiPencilOutline,
} from "@qwikest/icons/heroicons";
import type { Aisle } from "~/db/shops";

interface ShopAislesEditorProps {
  shopId: number;
}

export default component$(({ shopId }: ShopAislesEditorProps) => {
  const aisles = useSignal<Aisle[]>([]);
  const counts = useSignal<Record<number, number>>({});
  const isLoading = useSignal(true);
  const newAisleName = useSignal("");
  const editingAisleId = useSignal<number | null>(null);
  const editName = useSignal("");
  const error = useSignal("");

  const fetchAisles = $(async () => {
    isLoading.value = true;
    try {
      const response = await fetch(`/api/shops/${shopId}/aisles`);
      if (response.ok) {
        const data = await response.json();
        aisles.value = data.aisles;
        counts.value = data.counts;
      }
    } catch (err) {
      console.error("Failed to fetch aisles:", err);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(() => {
    fetchAisles();
  });

  const handleAddAisle = $(async () => {
    const name = newAisleName.value.trim();
    if (!name) return;
    error.value = "";
    try {
      const response = await fetch(`/api/shops/${shopId}/aisles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        newAisleName.value = "";
        await fetchAisles();
      } else {
        const data = await response.json().catch(() => ({}));
        error.value = data.error || "Nie udało się dodać alejki";
      }
    } catch (err) {
      console.error("Failed to add aisle:", err);
    }
  });

  const handleRename = $(async (aisleId: number) => {
    const name = editName.value.trim();
    if (!name) return;
    error.value = "";
    try {
      const response = await fetch(`/api/shops/${shopId}/aisles/${aisleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        editingAisleId.value = null;
        await fetchAisles();
      } else {
        const data = await response.json().catch(() => ({}));
        error.value = data.error || "Nie udało się zmienić nazwy";
      }
    } catch (err) {
      console.error("Failed to rename aisle:", err);
    }
  });

  const handleDelete = $(async (aisleId: number) => {
    error.value = "";
    try {
      const response = await fetch(`/api/shops/${shopId}/aisles/${aisleId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchAisles();
      } else {
        const data = await response.json().catch(() => ({}));
        error.value = data.error || "Nie udało się usunąć alejki";
      }
    } catch (err) {
      console.error("Failed to delete aisle:", err);
    }
  });

  const moveAisle = $(async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= aisles.value.length) return;
    const next = [...aisles.value];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    aisles.value = next;
    try {
      await fetch(`/api/shops/${shopId}/aisles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((a) => a.id) }),
      });
    } catch (err) {
      console.error("Failed to reorder aisles:", err);
    }
  });

  return (
    <section class="space-y-3">
      <div class="flex items-baseline justify-between">
        <h2 class="text-base font-bold text-gray-800 dark:text-gray-100">
          Alejki
        </h2>
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Kolejność = trasa zakupów
        </span>
      </div>

      {isLoading.value ? (
        <div class="flex justify-center py-6">
          <Loader size="sm" color="border-blue-500" />
        </div>
      ) : (
        <>
          {aisles.value.length === 0 ? (
            <p class="text-sm text-gray-500 dark:text-gray-400 py-2">
              Ten sklep nie ma jeszcze alejek.
            </p>
          ) : (
            <ul class="space-y-2">
              {aisles.value.map((aisle, index) => {
                const itemCount = counts.value[aisle.id] ?? 0;
                return (
                  <li
                    key={aisle.id}
                    class="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
                    data-testid={`aisle-row-${aisle.id}`}
                  >
                    <div class="flex flex-col gap-1 shrink-0">
                      <button
                        onClick$={() => moveAisle(index, -1)}
                        disabled={index === 0}
                        aria-label="Przesuń w górę"
                        data-testid={`aisle-up-${aisle.id}`}
                        class="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiChevronUpOutline class="w-5 h-5" />
                      </button>
                      <button
                        onClick$={() => moveAisle(index, 1)}
                        disabled={index === aisles.value.length - 1}
                        aria-label="Przesuń w dół"
                        data-testid={`aisle-down-${aisle.id}`}
                        class="p-2 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <HiChevronDownOutline class="w-5 h-5" />
                      </button>
                    </div>

                    {editingAisleId.value === aisle.id ? (
                      <div class="flex-1 space-y-2">
                        <input
                          value={editName.value}
                          onInput$={(e) =>
                            (editName.value = (e.target as HTMLInputElement).value)
                          }
                          maxLength={50}
                          autoFocus
                          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          data-testid={`aisle-edit-input-${aisle.id}`}
                        />
                        <div class="flex gap-2">
                          <button
                            onClick$={() => handleRename(aisle.id)}
                            data-testid={`aisle-save-${aisle.id}`}
                            class="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
                          >
                            Zapisz
                          </button>
                          <button
                            onClick$={() => (editingAisleId.value = null)}
                            class="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm"
                          >
                            Anuluj
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div class="flex-1 min-w-0">
                          <p class="text-base font-medium text-gray-800 dark:text-gray-100 truncate">
                            {aisle.name}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {itemCount}{" "}
                            {itemCount === 1 ? "pozycja" : "pozycji"}
                          </p>
                        </div>
                        <button
                          onClick$={() => {
                            editingAisleId.value = aisle.id;
                            editName.value = aisle.name;
                          }}
                          aria-label="Zmień nazwę"
                          data-testid={`aisle-rename-${aisle.id}`}
                          class="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400"
                        >
                          <HiPencilOutline class="w-5 h-5" />
                        </button>
                        <DoubleConfirmButton
                          onConfirm$={() => handleDelete(aisle.id)}
                          class="p-2"
                          data-testid={`aisle-delete-${aisle.id}`}
                        />
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div class="pt-2 space-y-2">
            <TextInput
              label="Nowa alejka"
              value={newAisleName.value}
              onInput$={(e) =>
                (newAisleName.value = (e.target as HTMLInputElement).value)
              }
              maxLength={50}
              class="w-full"
              placeholder="np. Nabiał"
            />
            <button
              onClick$={handleAddAisle}
              data-testid="add-aisle-btn"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600"
            >
              Dodaj alejkę
            </button>
          </div>

          {error.value && (
            <p class="text-sm text-red-600 dark:text-red-400">{error.value}</p>
          )}
        </>
      )}
    </section>
  );
});
