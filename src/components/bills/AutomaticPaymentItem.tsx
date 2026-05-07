import { component$, type PropFunction } from "@builder.io/qwik";
import type { BillsAutomaticPayment } from "~/db/bills";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface AutomaticPaymentItemProps {
  payment: BillsAutomaticPayment;
  isLoading: boolean;
  onDelete$: PropFunction<(id: number) => void>;
}

export default component$<AutomaticPaymentItemProps>(({ payment, isLoading, onDelete$ }) => {
  return (
    <li 
      data-testid="payment-item"
      class="flex items-center justify-between rounded bg-gray-50 p-2"
    >
      <div>
        <span class="font-medium">{payment.name}</span>
        <span class="ml-2 text-sm text-gray-500">({payment.slug})</span>
        <span class="ml-2 text-sm font-semibold">{payment.amount} PLN</span>
      </div>
      <DoubleConfirmButton
        onConfirm$={() => onDelete$(payment.id)}
        disabled={isLoading}
        text="Delete"
        class="rounded px-2 py-1 text-sm"
      />
    </li>
  );
});
