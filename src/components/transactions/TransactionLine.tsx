import { component$ } from "@builder.io/qwik";

interface TransactionLineProps {
  description: string;
  amount: number;
}

export default component$<TransactionLineProps>(({ description, amount }) => {
  const isPositive = amount >= 0;
  return (
    <div class="flex items-center py-2 text-sm">
      <span class="flex-1 text-gray-800 dark:text-gray-200">{description}</span>
      <span class={isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
        {isPositive ? "+" : ""}{amount}
      </span>
    </div>
  );
});