import TransactionLine from "./TransactionLine";
import PeriodHeader from "./PeriodHeader";

interface Transaction {
  id: number;
  description: string;
  amount: number;
}

interface TransactionGroupProps {
  periodStartTs: number;
  periodEndTs?: number;
  transactions: Transaction[];
}

export default (props: TransactionGroupProps) => {
  return (
    <div>
      <PeriodHeader startTs={props.periodStartTs} endTs={props.periodEndTs} />
      <div class="divide-y divide-gray-100">
        {props.transactions.map((tx) => (
          <TransactionLine
            key={tx.id}
            description={tx.description}
            amount={tx.amount}
          />
        ))}
      </div>
    </div>
  );
};
