import { component$, useVisibleTask$, useSignal, $ } from "@builder.io/qwik";
import type { BillsPredefinedPayment } from "~/db/bills";
import TextInput from "~/components/shared/TextInput";

interface BillsTransactionFormProps {
  loading: boolean;
  onSubmit$: (description: string, amount: number, predefinedSlug?: string) => void;
}

export default component$<BillsTransactionFormProps>(({ loading, onSubmit$ }) => {
  const predefinedPayments = useSignal<BillsPredefinedPayment[]>([]);
  const selectedPredefinedSlug = useSignal("");
  const description = useSignal("");
  const amount = useSignal("");

  useVisibleTask$(async () => {
    try {
      const res = await fetch("/api/bills/predefined-payments");
      if (res.ok) {
        const data = await res.json();
        predefinedPayments.value = data.payments;
      }
    } catch (e) {
      // Ignore - dropdown just won't show
    }
  });

  const handlePredefinedSelect = $((slug: string, name: string) => {
    selectedPredefinedSlug.value = slug;
    description.value = name;
  });

  const handleSubmit = $(() => {
    const a = amount.value;
    if (loading || !description.value || !a || isNaN(parseFloat(a))) return;
    onSubmit$(description.value, parseFloat(a), selectedPredefinedSlug.value || undefined);
    // Clear form
    description.value = "";
    amount.value = "";
    selectedPredefinedSlug.value = "";
  });

  return (
    <div>
      {/* Predefined payment dropdown */}
      {predefinedPayments.value.length > 0 && (
        <div class="mb-2">
          <select
            data-testid="bills-predefined-select"
            value={selectedPredefinedSlug.value}
            onChange$={(e) => {
              const slug = (e.target as HTMLSelectElement).value;
              if (slug) {
                const payment = predefinedPayments.value.find(p => p.slug === slug);
                if (payment) handlePredefinedSelect(slug, payment.name);
              } else {
                selectedPredefinedSlug.value = "";
                description.value = "";
              }
            }}
            class="w-full px-2 py-1 text-sm border rounded"
          >
            <option value="">Wybierz płatność (opcjonalnie)</option>
            {predefinedPayments.value.map(p => (
              <option key={p.id} value={p.slug}>
                {`${p.name} (${p.slug})`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Inline form - not using TransactionForm to avoid signal sync issues */}
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
          placeholder="Kwota (ujemna = wydatek)"
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
    </div>
  );
});
