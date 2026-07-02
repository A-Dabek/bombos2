import { component$, useSignal, useTask$, $ } from "@builder.io/qwik";
import TextInput from "../../shared/TextInput";

interface FlowsFormProps {
  description: string;
  amount: string;
  dayOfMonth: string;
  loading: boolean;
  onSubmit$: (description: string, amount: number, dayOfMonth: number) => void;
  submitLabel?: string;
}

export default component$<FlowsFormProps>(
  ({ description: descProp, amount: amountProp, dayOfMonth: dayProp, loading, onSubmit$, submitLabel = "Dodaj" }) => {
    const description = useSignal(descProp);
    const amount = useSignal(amountProp);
    const dayOfMonth = useSignal(dayProp);

    useTask$(({ track }) => {
      track(() => descProp);
      track(() => amountProp);
      track(() => dayProp);
      description.value = descProp;
      amount.value = amountProp;
      dayOfMonth.value = dayProp;
    });

    const handleSubmit = $(() => {
      if (loading || !description.value || !amount.value || !dayOfMonth.value) return;
      const a = parseFloat(amount.value);
      const d = parseInt(dayOfMonth.value);
      if (isNaN(a) || isNaN(d)) return;
      onSubmit$(description.value, a, d);
      
      // Clear local signals for "add" mode (where initial props are empty)
      if (descProp === "" && amountProp === "" && dayProp === "") {
        description.value = "";
        amount.value = "";
        dayOfMonth.value = "";
      }
    });

    return (
      <form
        class="flex flex-col gap-2"
        preventdefault:submit
        onSubmit$={handleSubmit}
      >
        <div class="grid grid-cols-4 gap-2">
          <div class="col-span-3">
            <TextInput
              type="text"
              placeholder="Opis"
              data-testid="flow-desc-input"
              class="w-full px-2 py-1 text-sm"
              value={description.value}
              onInput$={(e) => (description.value = (e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="col-span-1">
            <TextInput
              type="number"
              placeholder="Dzień"
              data-testid="flow-day-input"
              class="w-full px-2 py-1 text-sm text-center"
              value={dayOfMonth.value}
              onInput$={(e) => (dayOfMonth.value = (e.target as HTMLInputElement).value)}
              min={1}
              max={31}
            />
          </div>
        </div>
        <TextInput
          type="text"
          inputMode="decimal"
          placeholder="Kwota (dodatnia lub ujemna)"
          data-testid="flow-amount-input"
          class="px-2 py-1 text-sm"
          value={amount.value}
          onInput$={(e) => (amount.value = (e.target as HTMLInputElement).value)}
        />
        <button
          type="submit"
          data-testid="flow-add-btn"
          disabled={loading || !description.value || !amount.value || !dayOfMonth.value}
          class="rounded bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Zapisywanie..." : submitLabel}
        </button>
      </form>
    );
  },
);
