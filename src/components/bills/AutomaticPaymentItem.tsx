import { component$, type PropFunction } from "@builder.io/qwik";
import type { BillsAutomaticPayment } from "~/db/bills";

interface AutomaticPaymentItemProps {
  payment: BillsAutomaticPayment;
  isConfirming: boolean;
  isLoading: boolean;
  onDeleteClick$: PropFunction<(id: number) => void>;
}

export default component$<AutomaticPaymentItemProps>(({ payment, isConfirming, isLoading, onDeleteClick$ }) => {
  return (
    <li 
      data-testid="payment-item"
      class="flex items-center justify-between rounded bg-gray-50 p-2"
    >
      <div>
        <span class="font-medium">{payment.name}</span>
        <span class="ml-2 text-sm text-gray-500">({payment.slug})</span>
        <span class="ml-2 text-sm font-semibold">${payment.amount}</span>
      </div>
      <button
        data-testid={`payment-delete-${payment.id}`}
        onClick$={() => onDeleteClick$(payment.id)}
        disabled={isLoading}
        class="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {isConfirming ? "Confirm?" : "Delete"}
      </button>
    </li>
  );
});
