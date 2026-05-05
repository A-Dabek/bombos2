import { component$, useSignal, $ } from "@builder.io/qwik";

interface TransactionFormProps {
  description: string;
  amount: string;
  loading: boolean;
  onSubmit$: (description: string, amount: number) => void;
}

export default component$<TransactionFormProps>(
  ({ description: descProp, amount: amountProp, loading, onSubmit$ }) => {
    const description = useSignal(descProp);
    const amount = useSignal(amountProp);

    const handleSubmit = $(() => {
      const a = amount.value;
      if (loading || !description.value || !a || isNaN(parseFloat(a))) return;
      onSubmit$(description.value, parseFloat(a));
    });

    return (
      <form class="flex flex-col gap-2" onSubmit$={handleSubmit}>
        <input
          type="text"
          placeholder="Description"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          bind:value={description}
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Amount (negative for expense)"
          class="rounded border border-gray-300 px-2 py-1 text-sm"
          bind:value={amount}
        />
        <button
          type="submit"
          disabled={loading || !description.value || !amount.value}
          class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </form>
    );
  },
);