import { component$, useSignal, $ } from "@builder.io/qwik";
import { HiMinusOutline, HiPlusSolid, HiPencilOutline, HiTrashOutline, HiCheckCircleSolid } from "@qwikest/icons/heroicons";
import type { PlanItem } from "~/db/plan";

interface PlanItemRowProps {
  item: PlanItem;
  isActive: boolean;
  itemConfirm: number | null;
  onItemClick$: (itemId: number) => void;
  onAmountChange$: (itemId: number, delta: number) => void;
  onEditClick$: (item: PlanItem) => void;
  onRemove$: (itemId: number) => void;
}

export default component$(({
  item,
  isActive,
  itemConfirm,
  onItemClick$,
  onAmountChange$,
  onEditClick$,
  onRemove$,
}: PlanItemRowProps) => {
  return (
    <li
      key={item.id}
      class={`p-3 border rounded cursor-pointer ${
        isActive ? "bg-blue-50 border-blue-300" : "bg-white"
      }`}
      onClick$={() => onItemClick$(item.id)}
    >
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center">
            <span class="text-gray-800 font-medium">{item.name}</span>
            <span class="ml-2 px-2 py-0.5 bg-gray-200 text-gray-700 text-sm rounded">
              x{item.amount}
            </span>
          </div>
          {item.description && (
            <p class="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
        </div>
        {isActive && (
          <div class="flex items-center space-x-1 ml-2" onClick$={(e) => e.stopPropagation()}>
            <button
              onClick$={() => onAmountChange$(item.id, -1)}
              disabled={item.amount <= 1}
              class={`p-1 ${
                item.amount <= 1 ? "text-gray-300" : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Decrease amount"
            >
              <HiMinusOutline class="w-5 h-5" />
            </button>
            <button
              onClick$={() => onAmountChange$(item.id, 1)}
              class="p-1 text-gray-500 hover:text-gray-700"
              aria-label="Increase amount"
            >
              <HiPlusSolid class="w-5 h-5" />
            </button>
            <button
              onClick$={() => onEditClick$(item)}
              class="p-1 text-blue-500 hover:text-blue-700"
              aria-label="Edit"
            >
              <HiPencilOutline class="w-5 h-5" />
            </button>
            <button
              onClick$={() => onRemove$(item.id)}
              class={`p-1 ${
                itemConfirm === item.id ? "text-green-500 animate-bounce" : "text-red-500 hover:text-red-700"
              }`}
              aria-label="Remove"
              data-testid="item-remove-btn"
            >
              {itemConfirm === item.id ? (
                <HiCheckCircleSolid class="w-5 h-5" />
              ) : (
                <HiTrashOutline class="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </div>
    </li>
  );
});
