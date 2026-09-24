import {
  component$,
  useSignal,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import Loader from "~/components/shared/Loader";
import BackButton from "~/components/shared/BackButton";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import ShopAislesEditor from "./ShopAislesEditor";
import {
  HiStarOutline,
  HiStarSolid,
  HiPencilOutline,
} from "@qwikest/icons/heroicons";
import type { Shop } from "~/db/shops";

interface ShopDetailProps {
  shopId: number;
}

export default component$(({ shopId }: ShopDetailProps) => {
  const shop = useSignal<Shop | null>(null);
  const shopCount = useSignal(0);
  const activeShopId = useSignal<number | null>(null);
  const isLoading = useSignal(true);
  const editing = useSignal(false);
  const editName = useSignal("");
  const error = useSignal("");
  const nav = useNavigate();

  const fetchShop = $(async () => {
    isLoading.value = true;
    try {
      const [shopResp, shopsResp, settingsResp] = await Promise.all([
        fetch(`/api/shops/${shopId}`),
        fetch("/api/shops"),
        fetch("/api/settings"),
      ]);
      if (shopResp.ok) {
        shop.value = await shopResp.json();
        editName.value = shop.value?.name ?? "";
      }
      if (shopsResp.ok) {
        const shops = await shopsResp.json();
        shopCount.value = shops.length;
      }
      if (settingsResp.ok) {
        const settings = await settingsResp.json();
        activeShopId.value = settings.activeShop ?? null;
      }
    } catch (err) {
      console.error("Failed to fetch shop:", err);
    } finally {
      isLoading.value = false;
    }
  });

  useVisibleTask$(() => {
    fetchShop();
  });

  const handleRename = $(async () => {
    const name = editName.value.trim();
    if (!name) return;
    error.value = "";
    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        editing.value = false;
        await fetchShop();
      } else {
        const data = await response.json().catch(() => ({}));
        error.value = data.error || "Nie udało się zmienić nazwy";
      }
    } catch (err) {
      console.error("Failed to rename shop:", err);
    }
  });

  const handleSetActive = $(() => {
    activeShopId.value = shopId;
    fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeShop: shopId }),
    }).catch((err) => console.error("Failed to set active shop:", err));
  });

  const handleDelete = $(async () => {
    error.value = "";
    try {
      const response = await fetch(`/api/shops/${shopId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        nav("/groceries/shops");
      } else {
        const data = await response.json().catch(() => ({}));
        error.value = data.error || "Nie udało się usunąć sklepu";
      }
    } catch (err) {
      console.error("Failed to delete shop:", err);
    }
  });

  const isLastShop = shopCount.value <= 1;
  const isActive = activeShopId.value === shopId;

  return (
    <div class="p-4 space-y-5" data-testid="shop-detail">
      <BackButton href="/groceries/shops" />

      {isLoading.value ? (
        <div class="flex justify-center py-8">
          <Loader size="sm" color="border-blue-500" />
        </div>
      ) : !shop.value ? (
        <p class="text-lg text-gray-500 dark:text-gray-400">
          Nie znaleziono sklepu.
        </p>
      ) : (
        <>
          <div class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-3">
            <div class="flex items-center gap-3">
              <button
                onClick$={handleSetActive}
                aria-label={isActive ? "Aktywny sklep" : "Ustaw jako aktywny"}
                data-testid="shop-active"
                class={`p-2 shrink-0 rounded ${
                  isActive
                    ? "text-yellow-500"
                    : "text-gray-300 hover:text-yellow-500 dark:text-gray-600"
                }`}
              >
                {isActive ? (
                  <HiStarSolid class="w-7 h-7" />
                ) : (
                  <HiStarOutline class="w-7 h-7" />
                )}
              </button>

              {editing.value ? (
                <div class="flex-1 space-y-2">
                  <input
                    value={editName.value}
                    onInput$={(e) =>
                      (editName.value = (e.target as HTMLInputElement).value)
                    }
                    maxLength={50}
                    autoFocus
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    data-testid="shop-edit-input"
                  />
                  <div class="flex gap-2">
                    <button
                      onClick$={handleRename}
                      data-testid="shop-save"
                      class="px-4 py-2 bg-blue-500 text-white rounded text-sm font-medium hover:bg-blue-600"
                    >
                      Zapisz
                    </button>
                    <button
                      onClick$={() => (editing.value = false)}
                      class="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 class="flex-1 text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {shop.value.name}
                    {isActive && (
                      <span class="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                        aktywny
                      </span>
                    )}
                  </h1>
                  <button
                    onClick$={() => {
                      editing.value = true;
                      editName.value = shop.value?.name ?? "";
                    }}
                    aria-label="Zmień nazwę"
                    data-testid="shop-rename"
                    class="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400"
                  >
                    <HiPencilOutline class="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div class="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Usunięcie sklepu usuwa jego alejki i przypisania pozycji.
              </p>
              <DoubleConfirmButton
                onConfirm$={handleDelete}
                text="Usuń sklep"
                disabled={isLastShop}
                data-testid="shop-delete"
              />
            </div>
            {isLastShop && (
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Nie można usunąć ostatniego sklepu.
              </p>
            )}
          </div>

          <ShopAislesEditor shopId={shopId} />

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
