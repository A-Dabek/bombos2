import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import Loader from "~/components/shared/Loader";
import TextInput from "~/components/shared/TextInput";
import {
  HiStarOutline,
  HiStarSolid,
  HiChevronRightOutline,
} from "@qwikest/icons/heroicons";
import type { Shop } from "~/db/shops";

export default component$(() => {
  const shops = useSignal<Shop[]>([]);
  const activeShopId = useSignal<number | null>(null);
  const isLoading = useSignal(true);
  const newShopName = useSignal("");
  const error = useSignal("");

  const fetchShops = $(async () => {
    isLoading.value = true;
    try {
      const [shopsResp, settingsResp] = await Promise.all([
        fetch("/api/shops"),
        fetch("/api/settings"),
      ]);
      if (shopsResp.ok) {
        shops.value = await shopsResp.json();
      }
      if (settingsResp.ok) {
        const settings = await settingsResp.json();
        activeShopId.value = settings.activeShop ?? null;
      }
    } catch (err) {
      console.error("Failed to fetch shops:", err);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(() => {
    fetchShops();
  });

  const handleAddShop = $(async () => {
    const name = newShopName.value.trim();
    if (!name) return;
    error.value = "";
    try {
      const response = await fetch("/api/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        newShopName.value = "";
        await fetchShops();
      } else {
        const data = await response.json().catch(() => ({}));
        error.value = data.error || "Nie udało się dodać sklepu";
      }
    } catch (err) {
      console.error("Failed to add shop:", err);
    }
  });

  const handleSetActive = $((id: number) => {
    activeShopId.value = id;
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeShop: id }),
    }).catch((err) => console.error("Failed to set active shop:", err));
  });

  return (
    <div class="p-4 space-y-4">
      <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Sklepy</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Wybierz sklep, aby uporządkować jego alejki.
      </p>

      {isLoading.value ? (
        <div class="flex justify-center py-6">
          <Loader size="sm" color="border-blue-500" />
        </div>
      ) : (
        <>
          <ul class="space-y-2">
            {shops.value.map((shop) => {
              const isActive = activeShopId.value === shop.id;
              return (
                <li
                  key={shop.id}
                  class={`flex items-center gap-3 p-2 rounded-lg border bg-white dark:bg-gray-900 ${
                    isActive
                      ? "border-blue-400 dark:border-blue-500"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  data-testid={`shop-row-${shop.id}`}
                >
                  <button
                    onClick$={() => handleSetActive(shop.id)}
                    aria-label={isActive ? "Aktywny sklep" : "Ustaw jako aktywny"}
                    data-testid={`shop-active-${shop.id}`}
                    class={`p-2 rounded ${
                      isActive
                        ? "text-yellow-500"
                        : "text-gray-300 hover:text-yellow-500 dark:text-gray-600"
                    }`}
                  >
                    {isActive ? (
                      <HiStarSolid class="w-6 h-6" />
                    ) : (
                      <HiStarOutline class="w-6 h-6" />
                    )}
                  </button>
                  <Link
                    href={`/groceries/shops/${shop.id}`}
                    data-testid={`shop-open-${shop.id}`}
                    class="flex-1 flex items-center justify-between min-w-0 py-2"
                  >
                    <span class="text-lg font-medium text-gray-800 dark:text-gray-100 truncate">
                      {shop.name}
                      {isActive && (
                        <span class="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                          aktywny
                        </span>
                      )}
                    </span>
                    <HiChevronRightOutline class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </Link>
                </li>
              );
            })}
          </ul>

          <div class="pt-2 space-y-2">
            <TextInput
              label="Nowy sklep"
              value={newShopName.value}
              onInput$={(e) =>
                (newShopName.value = (e.target as HTMLInputElement).value)
              }
              maxLength={50}
              class="w-full"
              placeholder="np. Biedronka"
            />
            <button
              onClick$={handleAddShop}
              data-testid="add-shop-btn"
              class="w-full px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600"
            >
              Dodaj sklep
            </button>
          </div>

          {error.value && (
            <p
              class="text-sm text-red-600 dark:text-red-400"
              data-testid="shops-error"
            >
              {error.value}
            </p>
          )}
        </>
      )}
    </div>
  );
});
