import AllowanceTransactionLine from "./AllowanceTransactionLine";
import { type PropFunction } from "@builder.io/qwik";
import PeriodHeader from "../transactions/PeriodHeader";

interface AllowanceTransactionGroupProps {
  periodStartTs: number;
  transactions: any[];
  lastTransactionId: number | null;
  onDelete$: PropFunction<(id: number) => void>;
}

export default (props: AllowanceTransactionGroupProps) => {
  return (
    <div>
      <PeriodHeader startTs={props.periodStartTs} />
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
