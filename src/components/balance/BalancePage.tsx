import { component$, useVisibleTask$, useSignal, $, useContext } from "@builder.io/qwik";
import { apiRequest, jsonPost } from "~/lib/api";
import type { BalanceTransactionGroup } from "~/db/balance";
import TransactionForm from "~/components/transactions/TransactionForm";
import TransactionGroup from "~/components/transactions/TransactionGroup";
import AdminButton from "~/components/shared/AdminButton";
import Loader from "~/components/shared/Loader";
import LoadMoreButton from "~/components/shared/LoadMoreButton";
import { RefreshContext } from "~/constants/refresh";

const PAGE_SIZE = 3;

export default component$(() => {
  const groups = useSignal<BalanceTransactionGroup[]>([]);
  const loading = useSignal(false);
  const loadingMore = useSignal(false);
  const hasMore = useSignal(false);
  const loadedCount = useSignal(PAGE_SIZE);
  const error = useSignal<string | null>(null);
  const description = useSignal("");
  const amount = useSignal("");
  const refreshSignal = useContext(RefreshContext);

  const loadData = $(async () => {
    loading.value = true;
    try {
      const data = await apiRequest<{ groups: BalanceTransactionGroup[]; hasMore: boolean }>(
        `/api/balance/transactions?limit=${loadedCount.value}&offset=0`,
      );
      groups.value = data.groups ?? [];
      hasMore.value = data.hasMore ?? false;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  });

  const loadMore = $(async () => {
    if (loadingMore.value || !hasMore.value) return;
    loadingMore.value = true;
    error.value = null;
    try {
      const data = await apiRequest<{ groups: BalanceTransactionGroup[]; hasMore: boolean }>(
        `/api/balance/transactions?limit=${PAGE_SIZE}&offset=${groups.value.length}`,
      );
      groups.value = [...groups.value, ...(data.groups ?? [])];
      hasMore.value = data.hasMore ?? false;
      loadedCount.value = groups.value.length;
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loadingMore.value = false;
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
      await apiRequest("/api/balance/transactions", jsonPost({ description: desc, amount: amt }));
      await loadData();
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
      <AdminButton href="/money/balance/admin" />
      {error.value && <p class="mt-2 text-red-600 dark:text-red-400">{error.value}</p>}

      {loading.value && (
        <div class="flex justify-center py-4">
          <Loader />
        </div>
      )}

      <TransactionForm
        description={description.value}
        amount={amount.value}
        loading={loading.value}
        onSubmit$={handleAdd}
        negateAmount
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

      {hasMore.value && (
        <LoadMoreButton loading={loadingMore.value} onClick$={loadMore} />
      )}
    </div>
  );
});