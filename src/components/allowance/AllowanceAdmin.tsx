import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { AllowanceConfig } from "~/db/allowance";
import BackButton from "~/components/shared/BackButton";
import DayOfMonthInput from "~/components/shared/DayOfMonthInput";
import TextInput from "~/components/shared/TextInput";
import PeriodStartButton from "~/components/shared/PeriodStartButton";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const dayOfMonth = useSignal("");
  const monthlyAmount = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);

  useVisibleTask$(async () => {
    try {
      const data = await apiRequest<AllowanceConfig>("/api/allowance/config");
      config.value = data;
      dayOfMonth.value = data.day_of_month.toString();
      monthlyAmount.value = data.monthly_amount.toString();
    } catch (e: any) {
      error.value = e.message;
    }
  });

  const handleSave = $(async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
      const updated = await apiRequest<AllowanceConfig>("/api/allowance/config", jsonPost({
        day_of_month: Number(dayOfMonth.value),
        monthly_amount: Number(monthlyAmount.value),
      }));
      config.value = updated;
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  if (!config.value) {
    return (
      <div data-testid="loader" class="flex justify-center p-8">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div class="p-4">
      <BackButton href="/money/allowance" />
      <h1 class="text-xl font-semibold">Zarządzanie kieszonkowym</h1>

      {error.value && (
        <p class="mt-2 text-red-600">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600">Ustawienia zapisane!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <DayOfMonthInput
          dayOfMonth={dayOfMonth}
          data-testid="allowance-config-day"
        />

        <TextInput
          label="Miesięczna kwota"
          type="number"
          min="0"
          data-testid="allowance-config-amount"
          class="mt-1 px-2 py-1 text-sm w-32"
          value={monthlyAmount.value}
          onInput$={(e) => (monthlyAmount.value = (e.target as HTMLInputElement).value)}
        />

        <button
          onClick$={handleSave}
          disabled={loading.value}
          data-testid="allowance-config-save"
          class="w-fit rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Zapisywanie..." : "Zapisz"}
        </button>
      </div>

      <hr class="my-6 border-gray-200" />

      <h2 class="text-lg font-semibold">Ręczne sprawdzenie</h2>
      
      <div class="mt-4">
        <PeriodStartButton
          apiEndpoint="/api/allowance/admin/run-check"
          buttonText="Wykonaj sprawdzenie kieszonkowego"
        />
      </div>
    </div>
  );
});