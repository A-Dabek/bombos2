import TransactionLine from "./TransactionLine";
import PeriodHeader from "./PeriodHeader";

interface Transaction {
  id: number;
  description: string;
  amount: number;
}

interface TransactionGroupProps {
  periodLabel: string;
  transactions: Transaction[];
}

export default (props: TransactionGroupProps) => {
  return (
    <div>
      <PeriodHeader periodLabel={props.periodLabel} />
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
