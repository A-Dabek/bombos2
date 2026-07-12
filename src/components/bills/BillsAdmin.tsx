import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { BillsConfig } from "~/db/bills";
import type { BillsPredefinedPayment } from "~/db/bills";
import BackButton from "~/components/shared/BackButton";
import Loader from "~/components/shared/Loader";
import TextInput from "~/components/shared/TextInput";
import DayOfMonthInput from "~/components/shared/DayOfMonthInput";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";
import PeriodStartButton from "~/components/shared/PeriodStartButton";
import AutomaticPaymentsAdmin from "./AutomaticPaymentsAdmin";

export default component$(() => {
  // --- Signals ---
  const config = useSignal<BillsConfig | null>(null);
  const dayOfMonth = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);

  const predefinedPayments = useSignal<BillsPredefinedPayment[]>([]);
  const newPredefinedName = useSignal("");
  const newPredefinedSlug = useSignal("");
  const predefinedLoading = useSignal(false);
  const predefinedError = useSignal<string | null>(null);

  // --- Functions ---
  const handleSave = $(async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
      const updated = await apiRequest<BillsConfig>("/api/bills/config", jsonPost({
        day_of_month: Number(dayOfMonth.value),
      }));
      config.value = updated;
      dayOfMonth.value = updated.day_of_month.toString();
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const loadPredefinedPayments = $(async () => {
    predefinedLoading.value = true;
    predefinedError.value = null;
    try {
      const data = await apiRequest<{ payments: BillsPredefinedPayment[] }>("/api/bills/predefined-payments");
      predefinedPayments.value = data.payments;
    } catch (e: any) {
      predefinedError.value = e.message;
    } finally {
      predefinedLoading.value = false;
    }
  });

  const handleAddPredefined = $(async () => {
    const slugVal = newPredefinedSlug.value.trim();
    if (!newPredefinedName.value.trim() || !slugVal) {
      predefinedError.value = "Wymagana nazwa i slug";
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(slugVal)) {
      predefinedError.value = "Slug musi być jednym słowem (litery, cyfry i podkreślenia)";
      return;
    }

    predefinedError.value = null;
    try {
      await apiRequest("/api/bills/predefined-payments", jsonPost({
        name: newPredefinedName.value.trim(),
        slug: slugVal,
      }));
      newPredefinedName.value = "";
      newPredefinedSlug.value = "";
      await loadPredefinedPayments();
    } catch (e: any) {
      predefinedError.value = e.message;
    }
  });

  const handleDeletePredefined = $(async (paymentId: number) => {
    try {
      await apiRequest(`/api/bills/predefined-payments/${paymentId}`, { method: "DELETE" });
      await loadPredefinedPayments();
    } catch (e: any) {
      predefinedError.value = e.message;
    }
  });

  // --- Tasks ---
  useVisibleTask$(async () => {
    loading.value = true;
    try {
      const data = await apiRequest<BillsConfig>("/api/bills/config");
      config.value = data;
      dayOfMonth.value = data.day_of_month.toString();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async () => {
    await loadPredefinedPayments();
  });

  return (
    <div class="p-4">
      <BackButton href="/money/bills" />
      <h1 class="text-xl font-semibold">Zarządzanie rachunkami</h1>

      {loading.value && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {error.value && (
        <p class="mt-2 text-red-600">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600">Ustawienia zapisane!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <DayOfMonthInput
          dayOfMonth={dayOfMonth}
          id="day-of-month"
        />

        <button
          onClick$={handleSave}
          disabled={loading.value}
          data-testid="bills-config-save"
          class="w-fit rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Zapisywanie..." : "Zapisz"}
        </button>
      </div>

      <AutomaticPaymentsAdmin />

      <div class="mt-8 border-t pt-6">
        <h2 class="mb-4 text-lg font-semibold">Rozpoczęcie okresu</h2>
        <PeriodStartButton
          apiEndpoint="/api/bills/admin/run-period-start"
          buttonText="Wykonaj rozpoczęcie okresu"
          successPrefix="Created"
        />
      </div>

      <div class="mt-8 border-t pt-6">
        <h2 class="mb-4 text-lg font-semibold">Predefiniowane płatności</h2>

        {predefinedError.value && (
          <p class="mb-2 text-red-600">{predefinedError.value}</p>
        )}

        {predefinedLoading.value ? (
          <div class="flex justify-center py-4">
            <Loader />
          </div>
        ) : (
          <div class="mb-4 flex flex-col gap-2">
            {predefinedPayments.value.map((payment) => (
              <div
                key={payment.id}
                data-testid="predefined-item"
                class="flex items-center justify-between rounded border p-2"
              >
                <span>
                  {payment.name} <span class="text-sm text-gray-500">({payment.slug})</span>
                </span>
                <DoubleConfirmButton
                  onConfirm$={() => handleDeletePredefined(payment.id)}
                  text="Usuń"
                  class="px-2 py-1 text-sm rounded"
                />
              </div>
            ))}
            {predefinedPayments.value.length === 0 && (
              <p class="text-sm text-gray-500">Brak predefiniowanych płatności.</p>
            )}
          </div>
        )}

        <div class="flex flex-col gap-2">
          <TextInput
            label="Nazwa"
            placeholder="np. Prąd"
            value={newPredefinedName.value}
            onInput$={(e: any) => (newPredefinedName.value = e.target.value)}
            data-testid="predefined-name-input"
          />
          <TextInput
            label="Slug"
            placeholder="np. prad"
            value={newPredefinedSlug.value}
            onInput$={(e: any) => (newPredefinedSlug.value = e.target.value)}
            data-testid="predefined-slug-input"
          />
          <button
            onClick$={handleAddPredefined}
            data-testid="predefined-add-button"
            class="w-fit rounded bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
          >
            Dodaj płatność
          </button>
        </div>
      </div>
    </div>
  );
});
