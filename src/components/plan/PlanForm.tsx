import { component$, useSignal, $, useVisibleTask$ } from "@builder.io/qwik";
import TextInput from "~/components/shared/TextInput";
import TextArea from "~/components/shared/TextArea";
import Checkbox from "~/components/shared/Checkbox";
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

  // Scroll name input to top of screen when form opens (mobile keyboard UX)
  useVisibleTask$(({ track }) => {
    track(() => mode);
    // Wait for CSS transition (accordion expand + form slide, both 300ms) to settle
    const timer = setTimeout(() => {
      const input = document.querySelector<HTMLElement>(
        '[data-testid="edit-form-add"] input, [data-testid="edit-form-edit"] input'
      );
      if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 300);
    return () => clearTimeout(timer);
  });

  return (
    <div class="p-4 bg-white min-h-full" data-testid={mode === "add" ? "edit-form-add" : "edit-form-edit"}>
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        {mode === "add" ? "Dodaj pozycję" : "Edytuj pozycję"}
      </h2>
      <div class="space-y-4">
        <TextInput
          label="Nazwa *"
          value={formName.value}
          onInput$={(e) => (formName.value = (e.target as HTMLInputElement).value)}
          maxLength={100}
          class="w-full"
          autofocus
        />
        <TextArea
          label="Opis"
          value={formDescription.value}
          onInput$={(e) => (formDescription.value = (e.target as HTMLTextAreaElement).value)}
          maxLength={300}
          rows={3}
          class="w-full"
        />
        <div class="flex justify-end">
          <Checkbox
            label="Pilne"
            checked={formUrgent.value}
            onChange$={(e) => (formUrgent.value = (e.target as HTMLInputElement).checked)}
            class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
        </div>
        <div class="flex space-x-2">
          <button
            onClick$={onCancel$}
            data-testid="form-cancel-btn"
            class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Anuluj
          </button>
          <button
            onClick$={() => onSave$(formName.value, formDescription.value, formUrgent.value)}
            data-testid="form-save-btn"
            class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Zapisz
          </button>
          {mode === "add" && onNext$ && (
            <button
              onClick$={() => onNext$(formName.value, formDescription.value, formUrgent.value)}
              data-testid="form-next-btn"
              class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Dalej
            </button>
          )}
        </div>
      </div>
    </div>
  );
});