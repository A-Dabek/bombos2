import { component$, useVisibleTask$, useSignal, $, useContext } from "@builder.io/qwik";
import type { BillsTransactionGroup } from "~/db/bills";
import BillsTransactionForm from "~/components/bills/BillsTransactionForm";
import TransactionGroup from "~/components/transactions/TransactionGroup";
import AdminButton from "~/components/shared/AdminButton";
import Loader from "~/components/shared/Loader";
import { RefreshContext } from "~/constants/refresh";

export default component$(() => {
  const groups = useSignal<BillsTransactionGroup[]>([]);
  const loading = useSignal(false);
  const error = useSignal<string | null>(null);
  const refreshSignal = useContext(RefreshContext);

  const loadData = $(async () => {
    loading.value = true;
    try {
      const res = await fetch("/api/bills/transactions");
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = await res.json();
      groups.value = data.groups ?? [];
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(async ({ track }) => {
    track(() => refreshSignal.value);
    await loadData();
  });

  const handleAdd = $(async (desc: string, amt: number, predefinedSlug?: string) => {
    if (!desc || isNaN(amt) || amt === 0 || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const body: any = { description: desc, amount: amt };
      if (predefinedSlug) body.predefined_slug = predefinedSlug;
      
      const res = await fetch("/api/bills/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to add transaction");
      }
      await loadData();
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="p-4">
      <AdminButton href="/money/bills/admin" />
      {error.value && <p class="mt-2 text-red-600 dark:text-red-400">{error.value}</p>}

      {loading.value && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      <BillsTransactionForm
        loading={loading.value}
        onSubmit$={handleAdd}
      />

      {groups.value.length > 0 && (
        <div class="mt-6 space-y-4">
          {groups.value.map((group) => (
            <TransactionGroup
              key={group.periodStartTs}
              periodStartTs={group.periodStartTs}
              periodEndTs={group.periodEndTs}
              transactions={group.transactions}
            />
          ))}
        </div>
      )}
    </div>
  );
});