import { component$, useSignal, useTask$, $ } from "@builder.io/qwik";
import TextInput from "../shared/TextInput";

interface TransactionFormProps {
  description: string;
  amount: string;
  loading: boolean;
  onSubmit$: (description: string, amount: number) => void;
  negateAmount?: boolean;
}

export default component$<TransactionFormProps>(
  ({ description: descProp, amount: amountProp, loading, onSubmit$, negateAmount }) => {
    const description = useSignal(descProp);
    const amount = useSignal(amountProp);

    // Sync internal signals when props change (e.g., prefill from parent)
    useTask$(({ track }) => {
      track(() => descProp);
      track(() => amountProp);
      description.value = descProp;
      amount.value = amountProp;
    });

    const handleSubmit = $(() => {
      const a = amount.value;
      if (loading || !description.value || !a || isNaN(parseFloat(a))) return;
      let val = parseFloat(a);
      if (negateAmount) {
        val = -Math.abs(val);
      }
      onSubmit$(description.value, val);
    });

    return (
      <form
        class="flex flex-col gap-2"
        preventdefault:submit
        onSubmit$={handleSubmit}
      >
        <TextInput
          type="text"
          placeholder="Opis"
          data-testid="transaction-desc-input"
          class="px-2 py-1 text-sm"
          value={description.value}
          onInput$={(e) => (description.value = (e.target as HTMLInputElement).value)}
        />
        <TextInput
          type="text"
          inputMode="decimal"
          placeholder={negateAmount ? "Kwota" : "Kwota (ujemna = wydatek)"}
          data-testid="transaction-amount-input"
          class="px-2 py-1 text-sm"
          value={amount.value}
          onInput$={(e) => (amount.value = (e.target as HTMLInputElement).value)}
        />
        <button
          type="submit"
          data-testid="transaction-add-button"
          disabled={loading || !description.value || !amount.value}
          class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Dodawanie..." : "Dodaj"}
        </button>
      </form>
    );
  },
);
