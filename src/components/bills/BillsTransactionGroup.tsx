import TransactionGroup from "~/components/transactions/TransactionGroup";
import AutomaticPaymentsSection from "./AutomaticPaymentsSection";
import type { BillsAutomaticSummary, BillsTransaction } from "~/db/bills";

interface BillsTransactionGroupProps {
  periodStartTs: number;
  periodEndTs: number;
  transactions: BillsTransaction[];
  automatic: BillsAutomaticSummary | null;
}

export default (props: BillsTransactionGroupProps) => {
  return (
    <div>
      <TransactionGroup
        periodStartTs={props.periodStartTs}
        periodEndTs={props.periodEndTs}
        transactions={props.transactions}
      />
      {props.automatic && (
        <AutomaticPaymentsSection
          summary={props.automatic}
          startTs={props.periodStartTs}
          endTs={props.periodEndTs}
        />
      )}
    </div>
  );
};
