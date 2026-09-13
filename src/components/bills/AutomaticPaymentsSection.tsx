import { component$, useSignal, $ } from "@builder.io/qwik";
import type { BillsAutomaticSummary, BillsTransaction } from "~/db/bills";
import TransactionLine from "~/components/transactions/TransactionLine";

interface AutomaticPaymentsSectionProps {
  summary: BillsAutomaticSummary;
  startTs: number;
  endTs: number;
}

export default component$<AutomaticPaymentsSectionProps>(({ summary, startTs, endTs }) => {
  const expanded = useSignal(false);
  const transactions = useSignal<BillsTransaction[]>([]);
  const loading = useSignal(false);

  const toggle = $(async () => {
    if (expanded.value) {
      expanded.value = false;
      transactions.value = [];
      return;
    }
    loading.value = true;
    try {
      const res = await fetch(`/api/bills/transactions/automatic?start=${startTs}&end=${endTs}`);
      if (!res.ok) throw new Error("Failed to load automatic payments");
      const data = await res.json();
      transactions.value = data.transactions ?? [];
      expanded.value = true;
    } finally {
      loading.value = false;
    }
  });

  return (
    <div class="border-t border-gray-100 dark:border-gray-800 mt-2">
      <div class="flex items-center py-2 text-sm">
        <span class="flex-1 text-gray-800 dark:text-gray-200">Stałe opłaty</span>
        <span class="text-red-600 dark:text-red-400">{summary.total}</span>
      </div>
      {expanded.value ? (
        <div>
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            {transactions.value.map((tx) => (
              <TransactionLine
                key={tx.id}
                description={tx.description}
                amount={tx.amount}
              />
            ))}
          </div>
          <button
            type="button"
            data-testid="automatic-collapse-btn"
            onClick$={toggle}
            class="mt-1 text-sm text-blue-600 hover:underline"
          >
            Zwiń
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="automatic-expand-btn"
          onClick$={toggle}
          disabled={loading.value}
          class="mt-1 text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {loading.value ? "Wczytywanie..." : `Rozwiń (${summary.count})`}
        </button>
      )}
    </div>
  );
});