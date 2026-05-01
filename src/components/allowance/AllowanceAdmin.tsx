import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { AllowanceConfig } from "~/db/allowance";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const dayOfMonth = useSignal("");
  const monthlyAmount = useSignal("");
  const error = useSignal<string | null>(null);
  const success = useSignal(false);
  const loading = useSignal(false);

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

  return (
    <div class="p-4">
      <h1 class="text-xl font-semibold">Allowance Admin</h1>

      {error.value && (
        <p class="mt-2 text-red-600">{error.value}</p>
      )}

      {success.value && (
        <p data-testid="save-success" class="mt-2 text-green-600">Settings saved successfully!</p>
      )}

      <div class="mt-4 flex flex-col gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Day of Month (1-28)
          </label>
          <input
            type="number"
            min="1"
            max="28"
            class="mt-1 rounded border border-gray-300 px-2 py-1 text-sm w-24"
            bind:value={dayOfMonth}
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">
            Monthly Amount
          </label>
          <input
            type="number"
            min="0"
            class="mt-1 rounded border border-gray-300 px-2 py-1 text-sm w-32"
            bind:value={monthlyAmount}
          />
        </div>

        <button
          onClick$={handleSave}
          disabled={loading.value}
          class="w-fit rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
});
