import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { HiTrashOutline } from "@qwikest/icons/heroicons";
import { apiRequest, jsonPost } from "~/lib/api";
import BackButton from "~/components/shared/BackButton";
import Loader from "~/components/shared/Loader";
import TextInput from "~/components/shared/TextInput";

interface MergeCandidate {
  name: string;
  normalized: string;
  buyCount: number;
  onList: boolean;
}

export default component$(() => {
  const products = useSignal<MergeCandidate[]>([]);
  const isLoading = useSignal(true);
  const error = useSignal<string | null>(null);
  const target = useSignal<string>("");
  const staged = useSignal<string[]>([]);
  const search = useSignal("");
  const merging = useSignal(false);
  const confirming = useSignal(false);
  const timer = useSignal<ReturnType<typeof setTimeout> | null>(null);
  const result = useSignal<{ merged: number; target: string } | null>(null);

  const load = $(async () => {
    isLoading.value = true;
    try {
      const data = await apiRequest<{ products: MergeCandidate[] }>(
        "/api/groceries/admin",
      );
      products.value = data.products ?? [];
    } catch (e: any) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(() => {
    load();
  });

  useVisibleTask$(({ cleanup }) => {
    cleanup(() => {
      if (timer.value) clearTimeout(timer.value);
    });
  });

  const addToStaged = $((name: string) => {
    if (staged.value.includes(name)) return;
    staged.value = [...staged.value, name];
    if (target.value === "") target.value = name;
  });

  const setTarget = $((name: string) => {
    target.value = name;
  });

  const removeStaged = $((name: string) => {
    staged.value = staged.value.filter((n) => n !== name);
    if (target.value === name) target.value = staged.value[0] ?? "";
  });

  const handleMergeClick = $(async () => {
    const sources = staged.value.filter((n) => n !== target.value);
    if (!target.value || sources.length === 0 || merging.value) return;

    if (!confirming.value) {
      confirming.value = true;
      timer.value = setTimeout(() => {
        confirming.value = false;
        timer.value = null;
      }, 2000);
      return;
    }

    if (timer.value) {
      clearTimeout(timer.value);
      timer.value = null;
    }
    confirming.value = false;
    merging.value = true;
    error.value = null;
    result.value = null;
    try {
      const data = await apiRequest<{ merged: number; target: string }>(
        "/api/groceries/admin",
        jsonPost({ target: target.value, sources }),
      );
      result.value = data;
      target.value = "";
      staged.value = [];
      await load();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      merging.value = false;
    }
  });

  const query = search.value.trim().toLowerCase();
  const results = products.value.filter(
    (p) =>
      !staged.value.includes(p.name) &&
      (query === "" || p.name.toLowerCase().includes(query)),
  );
  const canMerge =
    staged.value.length >= 2 && target.value !== "" && !merging.value;

  return (
    <div
      class="min-h-screen p-4 bg-gray-50 dark:bg-gray-900"
      data-testid="groceries-admin"
    >
      <BackButton href="/groceries/planning" />

      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Scalanie produktów
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Scala duplikaty nazw produktów. Liczniki zakupów, historia zakupów,
        przypisania do alejek oraz pozycje na liście zostaną połączone z
        produktem docelowym.
      </p>

      {result.value && (
        <div
          role="status"
          data-testid="admin-merge-success"
          class="mb-4 p-3 rounded bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300"
        >
          Scalono {result.value.merged} produktów do „{result.value.target}”.
        </div>
      )}

      {error.value && (
        <div
          role="alert"
          data-testid="admin-merge-error"
          class="mb-4 p-3 rounded bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        >
          {error.value}
        </div>
      )}

      {isLoading.value && products.value.length === 0 && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {!isLoading.value && products.value.length === 0 && (
        <p class="text-lg text-gray-500 dark:text-gray-400">Brak produktów.</p>
      )}

      {products.value.length > 0 && (
        <div class="space-y-4">
          {staged.value.length > 0 && (
            <div data-testid="admin-merge-staged">
              <h2 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Wybrane do scalenia
              </h2>
              <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Kliknij produkt, aby wybrać nazwę główną. Pozostałe zostaną
                scalone do niej.
              </p>
              <ul class="space-y-2">
                {staged.value.map((name) => {
                  const candidate = products.value.find(
                    (p) => p.name === name,
                  );
                  const isTarget = name === target.value;
                  return (
                    <li
                      key={name}
                      data-testid="admin-merge-staged-row"
                      data-name={name}
                      class={[
                        "rounded border",
                        isTarget
                          ? "border-green-500 ring-2 ring-green-500"
                          : "border-gray-200 dark:border-gray-700",
                      ]}
                    >
                      <div class="flex items-center gap-3">
                        <button
                          type="button"
                          onClick$={() => setTarget(name)}
                          data-testid={`admin-merge-staged-select-${candidate?.normalized ?? name}`}
                          aria-pressed={isTarget}
                          class="flex flex-1 items-center gap-3 p-3 text-left bg-white dark:bg-gray-800 rounded-l cursor-pointer"
                        >
                          {isTarget && (
                            <span
                              data-testid="admin-merge-target-badge"
                              class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
                            >
                              Nazwa główna
                            </span>
                          )}
                          <span class="flex-1 text-gray-800 dark:text-gray-200">
                            {name}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">
                            {candidate?.buyCount ?? 0} zakupów
                            {candidate?.onList ? " • na liście" : ""}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick$={() => removeStaged(name)}
                          aria-label="Usuń pozycję"
                          data-testid={`admin-merge-remove-${candidate?.normalized ?? name}`}
                          class="mr-2 rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <HiTrashOutline class="h-5 w-5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <TextInput
            label="Szukaj"
            data-testid="admin-merge-search"
            placeholder="Szukaj…"
            value={search.value}
            onInput$={(e) =>
              (search.value = (e.target as HTMLInputElement).value)
            }
            containerClass="w-full"
            class="w-full"
          />

          {results.length === 0 ? (
            <p class="text-gray-500 dark:text-gray-400">Brak wyników.</p>
          ) : (
            <ul class="space-y-2">
              {results.map((p) => (
                <li
                  key={p.normalized}
                  data-testid="admin-merge-result-row"
                  data-name={p.name}
                  class="rounded border border-gray-200 dark:border-gray-700"
                >
                  <button
                    type="button"
                    onClick$={() => addToStaged(p.name)}
                    class="flex w-full items-center gap-3 p-3 text-left bg-white dark:bg-gray-800 rounded cursor-pointer"
                  >
                    <span class="flex-1 text-gray-800 dark:text-gray-200">
                      {p.name}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {p.buyCount} zakupów{p.onList ? " • na liście" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            data-testid="admin-merge-submit"
            onClick$={handleMergeClick}
            disabled={!canMerge}
            class={[
              "w-full px-4 py-2 rounded text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              confirming.value
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-500 hover:bg-blue-600",
            ]}
          >
            {confirming.value ? "Potwierdź scalenie" : "Scal zaznaczone"}
          </button>
        </div>
      )}
    </div>
  );
});
