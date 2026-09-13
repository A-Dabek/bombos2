import { component$ } from "@builder.io/qwik";
import TransactionGroup from "~/components/transactions/TransactionGroup";
import AutomaticPaymentsSection from "./AutomaticPaymentsSection";
import type { BillsAutomaticSummary, BillsTransaction } from "~/db/bills";

interface BillsTransactionGroupProps {
  periodStartTs: number;
  periodEndTs: number;
  transactions: BillsTransaction[];
  automatic: BillsAutomaticSummary | null;
}

export default component$<BillsTransactionGroupProps>(
  ({ periodStartTs, periodEndTs, transactions, automatic }) => {
    return (
      <div>
        <TransactionGroup
          periodStartTs={periodStartTs}
          periodEndTs={periodEndTs}
          transactions={transactions}
        />
        {automatic && (
          <AutomaticPaymentsSection
            summary={automatic}
            startTs={periodStartTs}
            endTs={periodEndTs}
          />
        )}
      </div>
    );
  },
);