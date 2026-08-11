import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BillsPredefinedPayment } from "~/db/bills";
import Loader from "~/components/shared/Loader";
import TextInput from "~/components/shared/TextInput";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import { apiRequest, jsonPost } from "~/lib/api";

export default component$(() => {
  const payments = useSignal<BillsPredefinedPayment[]>([]);
  const newName = useSignal("");
  const newSlug = useSignal("");
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);

  const loadPayments = $(async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await apiRequest<{ payments: BillsPredefinedPayment[] }>("/api/bills/predefined-payments");
      payments.value = data.payments;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadPayments();
  });

  const handleAdd = $(async () => {
    const slugVal = newSlug.value.trim();
    if (!newName.value.trim() || !slugVal) {
      error.value = "Wymagana nazwa i slug";
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(slugVal)) {
      error.value = "Slug musi być jednym słowem (litery, cyfry i podkreślenia)";
      return;
    }
    error.value = null;
    try {
      await apiRequest("/api/bills/predefined-payments", jsonPost({
        name: newName.value.trim(),
        slug: slugVal,
      }));
      newName.value = "";
      newSlug.value = "";
      await loadPayments();
    } catch (e: any) {
      error.value = e.message;
    }
  });

  const handleDelete = $(async (paymentId: number) => {
    try {
      await apiRequest(`/api/bills/predefined-payments/${paymentId}`, { method: "DELETE" });
      await loadPayments();
    } catch (e: any) {
      error.value = e.message;
    }
  });

  return (
    <div class="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Predefiniowane płatności</h2>

      {error.value && (
        <p class="mb-2 text-red-600 dark:text-red-400">{error.value}</p>
      )}

      {loading.value ? (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      ) : (
        <div class="mb-4 flex flex-col gap-2">
          {payments.value.map((payment) => (
            <div
              key={payment.id}
              data-testid="predefined-item"
              class="flex items-center justify-between rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2"
            >
              <span class="text-gray-900 dark:text-gray-100">
                {payment.name} <span class="text-sm text-gray-500 dark:text-gray-400">({payment.slug})</span>
              </span>
              <DoubleConfirmButton
                onConfirm$={() => handleDelete(payment.id)}
                text="Usuń"
                class="px-2 py-1 text-sm rounded"
              />
            </div>
          ))}
          {payments.value.length === 0 && (
            <p class="text-sm text-gray-500 dark:text-gray-400">Brak predefiniowanych płatności.</p>
          )}
        </div>
      )}

      <div class="flex flex-col gap-2">
        <TextInput
          label="Nazwa"
          placeholder="np. Prąd"
          value={newName.value}
          onInput$={(e: any) => (newName.value = e.target.value)}
          data-testid="predefined-name-input"
        />
        <TextInput
          label="Slug"
          placeholder="np. prad"
          value={newSlug.value}
          onInput$={(e: any) => (newSlug.value = e.target.value)}
          data-testid="predefined-slug-input"
        />
        <button
          onClick$={handleAdd}
          data-testid="predefined-add-button"
          class="w-fit rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
        >
          Dodaj płatność
        </button>
      </div>
    </div>
  );
});
