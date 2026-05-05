import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { AllowanceConfig } from "~/db/allowance";
import AdminButton from "~/components/shared/AdminButton";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const balance = useSignal<number>(0);
  const error = useSignal<string | null>(null);
  const description = useSignal("");
  const amount = useSignal<string>("");
  const loading = useSignal(false);
  const groups = useSignal<any[]>([]);
  const lastTransactionId = useSignal<number | null>(null);

  const loadData = $(async () => {
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
        groups.value = data.groups ?? [];
        lastTransactionId.value = data.lastTransactionId ?? null;
      }
    } catch {
      // Ignore
    }
  });

  useVisibleTask$(async () => {
    await loadData();
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
      await loadData();
      description.value = "";
      amount.value = "";
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const handleDelete = $(async (id: number) => {
    error.value = null;
    try {
      const res = await fetch(`/api/allowance/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to delete");
      }
      await loadData();
    } catch (e: any) {
      error.value = e.message;
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
      {error.value && <p class="mt-2 text-red-600">{error.value}</p>}

      <div class="mt-4 flex items-start gap-1">
        {/* Balance - big */}
        <span
          data-testid="allowance-balance"
          class={`text-4xl font-bold ${balance.value >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {Math.abs(balance.value)}
        </span>

        {/* Monthly amount - small, top-right like exponent */}
        {config.value && (
          <span data-testid="allowance-monthly-income" class="text-sm text-gray-800 self-start mt-1">
            +{config.value.monthly_amount}
          </span>
        )}
      </div>

      <form
        class="mt-4 flex flex-col gap-2"
        onSubmit$={handleAdd}
      >
        <input
          type="text"
          placeholder="Description"
          data-testid="allowance-desc-input"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          bind:value={description}
        />
        <input
          type="number"
          placeholder="Amount (negative for expense)"
          data-testid="allowance-amount-input"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          bind:value={amount}
        />
        <button
          type="submit"
          data-testid="allowance-add-button"
          disabled={loading.value}
          class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading.value ? "Adding..." : "Add"}
        </button>
      </form>

      {/* Admin Button */}
      <AdminButton href="/money/allowance/admin" />

      {/* Transaction Groups */}
      {groups.value.length > 0 && (
        <div class="mt-6 space-y-4">
          {groups.value.map((group) => (
            <div key={group.periodLabel}>
              <div data-testid="period-header" class="flex items-center gap-2 border-b border-gray-200 pb-1">
                <span class="text-sm font-semibold text-gray-700">{group.periodLabel}</span>
              </div>
              <div class="divide-y divide-gray-100">
                {group.transactions.map((tx: any) => (
                  <div key={tx.id} class="flex items-center py-2 text-sm">
                    <span class="flex-1 text-gray-800">{tx.description}</span>
                    <span class={tx.type === "expense" ? "text-red-600" : "text-green-600"}>
                      {tx.type === "expense" ? "-" : "+"}{tx.amount}
                    </span>
                    <span class="ml-4 text-gray-500">
                      ({tx.balance_after >= 0 ? "+" : ""}{tx.balance_after})
                    </span>
                    {/* Delete button - only on last transaction */}
                    {tx.id === lastTransactionId.value && (
                      <button
                        data-testid="delete-last-tx"
                        onClick$={() => handleDelete(tx.id)}
                        class="ml-2 text-red-500 hover:text-red-700 text-xs"
                        title="Delete"
                      >
                        X
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
