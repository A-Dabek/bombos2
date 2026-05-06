import { component$, type PropFunction } from "@builder.io/qwik";
import { HiTrashSolid } from "@qwikest/icons/heroicons";
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
      <button
        data-testid="meal-admin-delete"
        onClick$={() => onDelete$(meal.id)}
        class="p-2 text-red-500 hover:text-red-700"
        aria-label="Delete"
      >
        <HiTrashSolid class="w-5 h-5" />
      </button>
    </li>
  );
});
