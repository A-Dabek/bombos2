import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BalanceConfig } from "~/db/balance";
import BackButton from "~/components/shared/BackButton";
import Loader from "~/components/shared/Loader";
import DayOfMonthInput from "~/components/shared/DayOfMonthInput";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";

export default component$(() => {
  const config = useSignal<BalanceConfig | null>(null);
  const dayOfMonth = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);
  
  // Period start check state
  const periodLoading = useSignal(false);
  const periodError = useSignal<string | null>(null);
  const periodSuccess = useSignal(false);
  const periodResult = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    loading.value = true;
    try {
      const res = await fetch("/api/balance/config");
      if (!res.ok) throw new Error("Failed to load config");
      const data: BalanceConfig = await res.json();
      config.value = data;
      dayOfMonth.value = data.day_of_month.toString();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleSave = $(async () => {
    if (loading.value) return;
    loading.value = true;
    error.value = null;
    success.value = false;

    try {
      const res = await fetch("/api/balance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_month: Number(dayOfMonth.value),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update config");
      }

      const updated = await res.json();
      config.value = updated;
      dayOfMonth.value = updated.day_of_month.toString();
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleRunPeriodStart = $(async () => {
    periodLoading.value = true;
    periodError.value = null;
    periodSuccess.value = false;
    periodResult.value = null;

    try {
      const res = await fetch("/api/balance/admin/run-period-start", {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to run period start");
      
      periodResult.value = data.added ? "Added period-start." : "No period-start needed";
      periodSuccess.value = true;
    } catch (e: any) {
      periodError.value = e.message;
    } finally {
      periodLoading.value = false;
    }
  });

  return (
    <div class="p-4">
      <BackButton href="/money/balance" />
      <h1 class="text-xl font-semibold">Balance Admin</h1>

      {loading.value && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      {error.value && (
        <p class="mt-2 text-red-600">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600">Settings saved successfully!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <DayOfMonthInput
          dayOfMonth={dayOfMonth}
          id="day-of-month"
        />

        <button
          onClick$={handleSave}
          disabled={loading.value}
          class="w-fit rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Saving..." : "Save"}
        </button>
      </div>

      <div class="mt-8 border-t pt-6">
        <h2 class="mb-4 text-lg font-semibold">Period Start</h2>
        
        {periodError.value && (
          <p class="mb-2 text-red-600">{periodError.value}</p>
        )}
        
        {periodSuccess.value && periodResult.value && (
          <p data-testid="period-success" class="mb-2 text-green-600">{periodResult.value}</p>
        )}
        
        <DoubleConfirmButton
          onConfirm$={handleRunPeriodStart}
          text="Run Period Start Check"
          data-testid="period-start-btn"
          class="px-3 py-1.5 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={periodLoading.value}
        />
      </div>
    </div>
  );
});