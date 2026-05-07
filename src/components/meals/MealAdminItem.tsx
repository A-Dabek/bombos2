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
      class="flex items-center justify-between p-3 bg-white border rounded"
    >
      <span class="text-gray-800">{meal.name}</span>
      <DoubleConfirmButton
        onConfirm$={() => onDelete$(meal.id)}
        class="p-2"
      />
    </li>
  );
});
