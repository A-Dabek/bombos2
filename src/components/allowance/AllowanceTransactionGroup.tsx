import AllowanceTransactionLine from "./AllowanceTransactionLine";
import { type PropFunction } from "@builder.io/qwik";

interface AllowanceTransactionGroupProps {
  periodLabel: string;
  transactions: any[];
  lastTransactionId: number | null;
  onDelete$: PropFunction<(id: number) => void>;
}

export default (props: AllowanceTransactionGroupProps) => {
  return (
    <div>
      <div
        data-testid="period-header"
        class="flex items-center gap-2 border-b border-gray-200 pb-1"
      >
        <span class="text-sm font-semibold text-gray-700">
          {props.periodLabel}
        </span>
      </div>
      <div class="divide-y divide-gray-100">
        {props.transactions.map((tx: any) => (
          <AllowanceTransactionLine
            key={tx.id}
            tx={tx}
            isLast={tx.id === props.lastTransactionId}
            onDelete$={props.onDelete$}
          />
        ))}
      </div>
    </div>
  );
};
