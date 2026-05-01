import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
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
  const nav = useNavigate();

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

  // Get the last transaction id (highest id) for delete button visibility
  const getLastTransactionId = (): number | null => {
    for (const group of groups.value) {
      if (group.transactions && group.transactions.length > 0) {
        return group.transactions[0].id; // transactions are in DESC order
      }
    }
    return null;
  };

  const lastTxId = getLastTransactionId();

  return (
    <div class="p-4">
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

      {/* Admin Button */}
      <AdminButton href="/money/allowance/admin" />

      {/* Transaction Groups */}
      {groups.value.length > 0 && (
        <div class="mt-6 space-y-4">
          {groups.value.map((group) => (
            <div key={group.periodLabel}>
              <div class="flex items-center gap-2 border-b border-gray-200 pb-1">
                <span class="text-sm font-semibold text-gray-700">{group.periodLabel}</span>
                <span class="ml-auto text-sm text-gray-500">
                  {group.totalInGroup >= 0 ? "+" : ""}{group.totalInGroup}
                </span>
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
                    {tx.id === lastTxId && (
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
