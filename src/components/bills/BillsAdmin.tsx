import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { BillsConfig } from "~/db/bills";
import BackButton from "~/components/shared/BackButton";
import Loader from "~/components/shared/Loader";
import DayOfMonthInput from "~/components/shared/DayOfMonthInput";
import PeriodStartButton from "~/components/shared/PeriodStartButton";
import AutomaticPaymentsAdmin from "./AutomaticPaymentsAdmin";
import PredefinedPaymentsAdmin from "./PredefinedPaymentsAdmin";

export default component$(() => {
  // --- Signals ---
  const config = useSignal<BillsConfig | null>(null);
  const dayOfMonth = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);

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

      <PredefinedPaymentsAdmin />
    </div>
  );
});
