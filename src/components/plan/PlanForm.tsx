import { component$, useSignal, $ } from "@builder.io/qwik";
import type { PlanItem } from "~/db/plan";

interface PlanFormProps {
  mode: "add" | "edit";
  initialName?: string;
  initialDescription?: string;
  initialUrgent?: boolean;
  onSave$: (name: string, description: string, urgent: boolean) => void;
  onNext$?: (name: string, description: string, urgent: boolean) => void;
  onCancel$: () => void;
}

export default component$(({
  mode,
  initialName = "",
  initialDescription = "",
  initialUrgent = false,
  onSave$,
  onNext$,
  onCancel$,
}: PlanFormProps) => {
  const formName = useSignal(initialName);
  const formDescription = useSignal(initialDescription);
  const formUrgent = useSignal(initialUrgent);

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
            autofocus
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
        <div class="flex justify-end">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formUrgent.value}
              onChange$={(e) => (formUrgent.value = (e.target as HTMLInputElement).checked)}
              class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <span class="text-sm font-medium text-gray-700">Urgent</span>
          </label>
        </div>
        <div class="flex space-x-2">
          <button
            onClick$={onCancel$}
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick$={() => onSave$(formName.value, formDescription.value, formUrgent.value)}
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
          {mode === "add" && onNext$ && (
            <button
              onClick$={() => onNext$(formName.value, formDescription.value, formUrgent.value)}
              class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
});