import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
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
  const selected = useSignal<string[]>([]);
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

  const toggle = $((name: string) => {
    selected.value = selected.value.includes(name)
      ? selected.value.filter((n) => n !== name)
      : [...selected.value, name];
  });

  const handleMergeClick = $(async () => {
    if (!target.value || selected.value.length === 0 || merging.value) return;

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
        jsonPost({ target: target.value, sources: selected.value }),
      );
      result.value = data;
      target.value = "";
      selected.value = [];
      await load();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      merging.value = false;
    }
  });

  const query = search.value.trim().toLowerCase();
  const filtered = products.value.filter(
    (p) =>
      p.name !== target.value &&
      (query === "" || p.name.toLowerCase().includes(query)),
  );
  const canMerge =
    target.value !== "" && selected.value.length > 0 && !merging.value;

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
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="sm:w-1/2">
              <label
                for="admin-merge-target"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Produkt docelowy
              </label>
              <select
                id="admin-merge-target"
                data-testid="admin-merge-target"
                aria-label="Produkt docelowy"
                value={target.value}
                onChange$={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  target.value = value;
                  selected.value = selected.value.filter((n) => n !== value);
                }}
                class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Wybierz produkt docelowy…</option>
                {products.value.map((p) => (
                  <option key={p.normalized} value={p.name}>
                    {`${p.name} (${p.buyCount})`}
                  </option>
                ))}
              </select>
            </div>
            <div class="sm:w-1/2">
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
            </div>
          </div>

          {filtered.length === 0 ? (
            <p class="text-gray-500 dark:text-gray-400">Brak wyników.</p>
          ) : (
            <ul class="space-y-2">
              {filtered.map((p) => {
                const checked = selected.value.includes(p.name);
                return (
                  <li
                    key={p.normalized}
                    data-testid="admin-merge-row"
                    data-name={p.name}
                    class={[
                      "rounded border border-gray-200 dark:border-gray-700",
                      checked ? "ring-2 ring-blue-500" : "",
                    ]}
                  >
                    <label class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange$={() => toggle(p.name)}
                        data-testid={`admin-merge-checkbox-${p.normalized}`}
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span class="flex-1 text-gray-800 dark:text-gray-200">
                        {p.name}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {p.buyCount} zakupów{p.onList ? " • na liście" : ""}
                      </span>
                    </label>
                  </li>
                );
              })}
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
