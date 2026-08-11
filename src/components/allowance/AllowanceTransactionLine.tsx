import { component$, type PropFunction } from "@builder.io/qwik";

interface AllowanceTransactionLineProps {
  tx: any;
  isLast: boolean;
  onDelete$: PropFunction<(id: number) => void>;
}

export default component$<AllowanceTransactionLineProps>(({ tx, isLast, onDelete$ }) => {
  return (
    <div class="flex items-center py-2 text-sm">
      <span class="flex-1 text-gray-800 dark:text-gray-200">{tx.description}</span>
      <span
        class={
          tx.type === "expense"
            ? "text-red-600 dark:text-red-400"
            : "text-green-600 dark:text-green-400"
        }
      >
        {tx.type === "expense" ? "-" : "+"}
        {tx.amount}
      </span>
      <span class="ml-4 text-gray-500 dark:text-gray-400">
        ({tx.balance_after >= 0 ? "+" : ""}
        {tx.balance_after})
      </span>
      {/* Delete button - only on last transaction */}
      {isLast && (
        <button
          data-testid="delete-last-tx"
          onClick$={() => onDelete$(tx.id)}
          class="ml-2 text-red-500 hover:text-red-700 text-xs"
          title="Usuń"
        >
          X
        </button>
      )}
    </div>
  );
});
