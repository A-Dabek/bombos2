import { component$, useVisibleTask$, useSignal, $, useContext } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { AllowanceConfig } from "~/db/allowance";
import AdminButton from "~/components/shared/AdminButton";
import TransactionForm from "../transactions/TransactionForm";
import AllowanceTransactionGroup from "./AllowanceTransactionGroup";
import { RefreshContext } from "~/constants/refresh";

export default component$(() => {
  const config = useSignal<AllowanceConfig | null>(null);
  const balance = useSignal<number>(0);
  const error = useSignal<string | null>(null);
  const description = useSignal("");
  const amount = useSignal<string>("");
  const loading = useSignal(false);
  const groups = useSignal<any[]>([]);
  const lastTransactionId = useSignal<number | null>(null);
  const refreshSignal = useContext(RefreshContext);

  const loadData = $(async () => {
    try {
      config.value = await apiRequest<AllowanceConfig>("/api/allowance/config");
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

  useVisibleTask$(async ({ track }) => {
    track(() => refreshSignal.value);
    await loadData();
  });

  const handleAdd = $(async (desc: string, amt: number) => {
    if (!desc || isNaN(amt) || amt === 0 || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      await apiRequest("/api/allowance/transactions", jsonPost({ description: desc, amount: amt }));
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
      await apiRequest(`/api/allowance/transactions/${id}`, { method: "DELETE" });
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
      {error.value && <p class="mt-2 text-red-600 dark:text-red-400">{error.value}</p>}

      <div class="mt-4 mb-4 flex items-start gap-1">
        {/* Balance - big */}
        <span
          data-testid="allowance-balance"
          class={`text-4xl font-bold ${balance.value >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {Math.abs(balance.value)}
        </span>

        {/* Monthly amount - small, top-right like exponent */}
        {config.value && (
          <span
            data-testid="allowance-monthly-income"
            class="text-sm text-gray-800 dark:text-gray-200 self-start mt-1"
          >
            +{config.value.monthly_amount}
          </span>
        )}
      </div>

      <TransactionForm
        description={description.value}
        amount={amount.value}
        loading={loading.value}
        onSubmit$={handleAdd}
      />

      {/* Admin Button */}
      <AdminButton href="/money/allowance/admin" />

      {/* Transaction Groups */}
      {groups.value.length > 0 && (
        <div class="mt-6 space-y-4">
          {groups.value.map((group) => (
            <AllowanceTransactionGroup
              key={group.periodStartTs}
              periodStartTs={group.periodStartTs}
              transactions={group.transactions}
              lastTransactionId={lastTransactionId.value}
              onDelete$={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});
