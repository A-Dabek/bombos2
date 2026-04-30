import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import type { AllowanceConfig } from "~/db/allowance";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const balance = useSignal<number>(0);
  const error = useSignal<string | null>(null);
  const description = useSignal("");
  const amount = useSignal<string>("");
  const loading = useSignal(false);
  const nav = useNavigate();

  useVisibleTask$(async () => {
    try {
      const res = await fetch("/api/allowance/config");
      if (!res.ok) throw new Error("Failed to load config");
      config.value = await res.json();
    } catch (e: any) {
      error.value = e.message;
    }

    try {
      const res = await fetch("/api/allowance/transactions");
      if (res.ok) {
        const data = await res.json();
        balance.value = data.balance ?? 0;
      }
    } catch {
      // Balance stays 0
    }
  });

  const handleAdd = $(async () => {
    if (!description.value || !amount.value || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch("/api/allowance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.value,
          amount: Number(amount.value),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add transaction");
      }
      // Refresh
      const data = await (await fetch("/api/allowance/transactions")).json();
      balance.value = data.balance ?? 0;
      description.value = "";
      amount.value = "";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="p-4">
      <h1 class="text-xl font-semibold">Allowance</h1>

      {error.value && <p class="mt-2 text-red-600">{error.value}</p>}

      <div class="mt-4 space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-gray-600">Current balance:</span>
          <span class={balance.value >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
            {balance.value >= 0 ? "+" : "-"}{Math.abs(balance.value)}
          </span>
        </div>

        {config.value && (
          <div class="flex items-center gap-2">
            <span class="text-gray-600">Monthly income:</span>
            <span class="text-green-600 font-semibold">
              monthly: +{config.value.monthly_amount}
            </span>
          </div>
        )}
      </div>

      <form
        class="mt-4 flex flex-col gap-2"
        onSubmit$={handleAdd}
      >
        <input
          type="text"
          placeholder="Description"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          bind:value={description}
        />
        <input
          type="number"
          placeholder="Amount (negative for expense)"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          bind:value={amount}
        />
        <button
          type="submit"
          disabled={loading.value}
          class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Adding..." : "Add"}
        </button>
      </form>

      <a
        href="/money/allowance/admin"
        class="mt-4 inline-block rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
      >
        Admin
      </a>
    </div>
  );
});
