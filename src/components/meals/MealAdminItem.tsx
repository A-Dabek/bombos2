import { component$, type PropFunction } from "@builder.io/qwik";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";
import type { MealRow } from "~/db/meals";

interface MealAdminItemProps {
  meal: MealRow;
  onDelete$: PropFunction<(id: number) => void>;
}

export default component$<MealAdminItemProps>(({ meal, onDelete$ }) => {
  return (
    <li
      role="listitem"
      class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
    >
      <span class="text-gray-800 dark:text-gray-200">{meal.name}</span>
      <DoubleConfirmButton
        onConfirm$={() => onDelete$(meal.id)}
        class="p-2"
      />
    </li>
  );
});
