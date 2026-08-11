import { component$, useSignal, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import BackButton from "~/components/shared/BackButton";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";

export default component$(() => {
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const deletedCount = useSignal(0);

  const handleCleanup = $(async () => {
    loading.value = true;
    error.value = null;
    success.value = false;
    try {
      const res = await fetch("/api/parcels/admin/run-cleanup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to run cleanup");
      deletedCount.value = data.deleted;
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="p-4">
      <BackButton href="/parcels" />
      <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">Zarządzanie paczkami</h1>

      {error.value && <p class="mt-2 text-red-600 dark:text-red-400">{error.value}</p>}
      {success.value && (
        <p class="mt-2 text-green-600 dark:text-green-400">
          Sprzątanie zakończone. Usunięto {deletedCount.value} paczek.
        </p>
      )}

      <div class="mt-4">
        <DoubleConfirmButton
          onConfirm$={handleCleanup}
          text="Sprzątnij gotowe paczki"
          class="px-3 py-1.5 text-sm rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
          disabled={loading.value}
        />
      </div>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Zarządzanie paczkami",
};
