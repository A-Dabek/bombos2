import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { AllowanceConfig } from "~/db/allowance";
import BackButton from "~/components/shared/BackButton";
import DayOfMonthInput from "~/components/shared/DayOfMonthInput";
import TextInput from "~/components/shared/TextInput";
import DoubleConfirmButton from "~/components/shared/DoubleConfirmButton";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const dayOfMonth = useSignal("");
  const monthlyAmount = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);
  
  // Run check state
  const runLoading = useSignal(false);
  const runError = useSignal<string | null>(null);
  const runSuccess = useSignal(false);
  const runResult = useSignal<string | null>(null);

  useVisibleTask$(async () => {
    try {
      const res = await fetch("/api/allowance/config");
      if (!res.ok) throw new Error("Failed to load config");
      const data: AllowanceConfig = await res.json();
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
      const res = await fetch("/api/allowance/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_of_month: Number(dayOfMonth.value),
          monthly_amount: Number(monthlyAmount.value),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update config");
      }

      const updated = await res.json();
      config.value = updated;
      success.value = true;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleRunCheck = $(async () => {
    runLoading.value = true;
    runError.value = null;
    runSuccess.value = false;
    runResult.value = null;

    try {
      const res = await fetch("/api/allowance/admin/run-check", {
        method: "POST",
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to run check");
      
      runResult.value = data.added 
        ? `Added $${data.newBalance} allowance` 
        : "No allowance needed";
      runSuccess.value = true;
    } catch (e: any) {
      runError.value = e.message;
    } finally {
      runLoading.value = false;
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
      <h1 class="text-xl font-semibold">Allowance Admin</h1>

      {error.value && (
        <p class="mt-2 text-red-600">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600">Settings saved successfully!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <DayOfMonthInput
          dayOfMonth={dayOfMonth}
          data-testid="allowance-config-day"
        />

        <TextInput
          label="Monthly Amount"
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
          {loading.value ? "Saving..." : "Save"}
        </button>
      </div>

      <hr class="my-6 border-gray-200" />

      <h2 class="text-lg font-semibold">Manual Check</h2>
      
      {runError.value && (
        <p class="mt-2 text-red-600">{runError.value}</p>
      )}
      
      {runSuccess.value && runResult.value && (
        <p data-testid="run-success" class="mt-2 text-green-600">{runResult.value}</p>
      )}
      
      <div class="mt-4">
        <DoubleConfirmButton
          onConfirm$={handleRunCheck}
          text="Run Allowance Check"
          data-testid="run-check-btn"
          class="px-3 py-1.5 text-sm rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={runLoading.value}
        />
      </div>
    </div>
  );
});