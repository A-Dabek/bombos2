import { component$, useSignal, $ } from "@builder.io/qwik";
import type { PlanItem } from "~/db/plan";

interface PlanFormProps {
  mode: "add" | "edit";
  initialName?: string;
  initialDescription?: string;
  initialAmount?: number;
  onSave$: (name: string, description: string, amount: number) => void;
  onCancel$: () => void;
}

export default component$(({
  mode,
  initialName = "",
  initialDescription = "",
  initialAmount = 1,
  onSave$,
  onCancel$,
}: PlanFormProps) => {
  const formName = useSignal(initialName);
  const formDescription = useSignal(initialDescription);
  const formAmount = useSignal(initialAmount);

  return (
    <div class="p-4 bg-white min-h-full" data-testid={mode === "add" ? "edit-form-add" : "edit-form-edit"}>
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        {mode === "add" ? "Add Item" : "Edit Item"}
      </h2>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formName.value}
            onInput$={(e) => (formName.value = (e.target as HTMLInputElement).value)}
            maxLength={100}
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formDescription.value}
            onInput$={(e) => (formDescription.value = (e.target as HTMLTextAreaElement).value)}
            maxLength={300}
            rows={3}
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={formAmount.value}
            onInput$={(e) => (formAmount.value = parseInt((e.target as HTMLInputElement).value, 10) || 1)}
            min={1}
            class="w-full px-3 py-2 border rounded"
          />
        </div>
        <div class="flex space-x-2">
          <button
            onClick$={() => onSave$(formName.value, formDescription.value, formAmount.value)}
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick$={onCancel$}
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});
