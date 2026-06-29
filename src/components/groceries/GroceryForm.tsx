import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import TextInput from "~/components/shared/TextInput";
import TextArea from "~/components/shared/TextArea";
import Checkbox from "~/components/shared/Checkbox";

interface GroceryFormProps {
  mode: "add" | "edit";
  initialName?: string;
  initialDescription?: string;
  initialUrgent?: boolean;
  initialAmount?: number;
  initialUnit?: string;
  initialCategory?: string;
  onSave$: (
    name: string,
    description: string,
    urgent: boolean,
    amount: number,
    unit: string,
    category: string | null,
  ) => void;
  onNext$?: (
    name: string,
    description: string,
    urgent: boolean,
    amount: number,
    unit: string,
    category: string | null,
  ) => void;
  onCancel$: () => void;
}

export default component$(
  ({
    mode,
    initialName = "",
    initialDescription = "",
    initialUrgent = false,
    initialAmount,
    initialUnit = "x",
    initialCategory = "",
    onSave$,
    onNext$,
    onCancel$,
  }: GroceryFormProps) => {
    const formName = useSignal(initialName);
    const formDescription = useSignal(initialDescription);
    const formUrgent = useSignal(initialUrgent);
    const formAmount = useSignal<number | null>(initialAmount ?? null);
    const formUnit = useSignal(initialUnit);
    const formCategory = useSignal(initialCategory);
    const lastAddedName = useSignal("");
    const allCategories = useSignal<string[]>([]);

    useVisibleTask$(async () => {
      try {
        const response = await fetch("/api/groceries/categories");
        if (response.ok) {
          allCategories.value = await response.json();
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    });

    useVisibleTask$(({ track }) => {
      const name = track(() => formName.value);
      if (mode === "add" && name.trim().length > 2) {
        const timer = setTimeout(async () => {
          try {
            const response = await fetch(`/api/groceries/suggest-category?name=${encodeURIComponent(name)}`);
            if (response.ok) {
              const { category } = await response.json();
              if (category && !formCategory.value) {
                formCategory.value = category;
              }
            }
          } catch (error) {
            console.error("Failed to fetch suggested category:", error);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    });

    useVisibleTask$(({ track }) => {
      track(() => mode);
      const timer = setTimeout(() => {
        const input = document.querySelector<HTMLElement>(
          '[data-testid="edit-form-add"] input, [data-testid="edit-form-edit"] input',
        );
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
      return () => clearTimeout(timer);
    });

    return (
      <div
        class="p-4 bg-white min-h-full"
        data-testid={mode === "add" ? "edit-form-add" : "edit-form-edit"}
      >
        <h2 class="text-xl font-bold text-gray-800 mb-4">
          {mode === "add" ? "Dodaj pozycję" : "Edytuj pozycję"}
        </h2>
        <div class="space-y-4">
          <TextInput
            label="Nazwa *"
            value={formName.value}
            onInput$={(e) =>
              (formName.value = (e.target as HTMLInputElement).value)
            }
            maxLength={100}
            class="w-full"
            autofocus
          />
          <TextArea
            label="Opis"
            value={formDescription.value}
            onInput$={(e) =>
              (formDescription.value = (e.target as HTMLTextAreaElement).value)
            }
            maxLength={300}
            rows={3}
            class="w-full"
          />
          <div class="flex space-x-4">
            <div class="flex-1">
              <TextInput
                label="Ilość"
                type="number"
                step="0.01"
                placeholder="1"
                value={formAmount.value?.toString() ?? ""}
                onInput$={(e) =>
                  (formAmount.value =
                    parseFloat((e.target as HTMLInputElement).value) || null)
                }
                class="w-full"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Jednostka
              </label>
              <select
                value={formUnit.value}
                onChange$={(e) =>
                  (formUnit.value = (e.target as HTMLSelectElement).value)
                }
                class="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="x">x</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
              </select>
            </div>
          </div>
          <div class="w-full">
            <TextInput
              label="Kategoria"
              value={formCategory.value}
              onInput$={(e) =>
                (formCategory.value = (e.target as HTMLInputElement).value)
              }
              maxLength={50}
              class="w-full"
              list="categories-list"
              placeholder="np. Owoce, Nabiał..."
            />
            <datalist id="categories-list">
              {allCategories.value.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          <div class="flex justify-end">
            <Checkbox
              label="Pilne"
              checked={formUrgent.value}
              onChange$={(e) =>
                (formUrgent.value = (e.target as HTMLInputElement).checked)
              }
              class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
          </div>

          {lastAddedName.value && (
            <div class="text-sm text-green-600 font-medium animate-pulse" data-testid="form-feedback">
              Poprzednio dodano: {lastAddedName.value}
            </div>
          )}

          <div class="flex space-x-2">
            <button
              onClick$={onCancel$}
              data-testid="form-cancel-btn"
              class="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Anuluj
            </button>
            <button
              onClick$={() =>
                onSave$(
                  formName.value,
                  formDescription.value,
                  formUrgent.value,
                  formAmount.value ?? 1.0,
                  formUnit.value,
                  formCategory.value,
                )
              }
              data-testid="form-save-btn"
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Zapisz
            </button>
            {mode === "add" && onNext$ && (
              <button
                onClick$={() => {
                  lastAddedName.value = formName.value;
                  onNext$(
                    formName.value,
                    formDescription.value,
                    formUrgent.value,
                    formAmount.value ?? 1.0,
                    formUnit.value,
                    formCategory.value,
                  );
                  formName.value = "";
                  formDescription.value = "";
                  formUrgent.value = false;
                  formAmount.value = null;
                  formUnit.value = "x";
                  formCategory.value = "";
                  // Focus back on name input
                  const input = document.querySelector<HTMLElement>(
                    '[data-testid="edit-form-add"] input',
                  );
                  if (input) input.focus();
                }}
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
  },
);
