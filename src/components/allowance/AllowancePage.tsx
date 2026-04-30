import { component$, useVisibleTask$, useSignal } from "@builder.io/qwik";
import type { AllowanceConfig } from "~/db/allowance";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const balance = useSignal<number>(0);
  const error = useSignal<string | null>(null);

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
        if (data.transactions && data.transactions.length > 0) {
          balance.value = data.transactions[0].balance_after;
        }
      }
    } catch {
      // Balance stays 0
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

      <a
        href="/money/allowance/admin"
        class="mt-4 inline-block rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
      >
        Admin
      </a>
    </div>
  );
});
