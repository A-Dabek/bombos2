import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import TextInput from "~/components/shared/TextInput";
import TextArea from "~/components/shared/TextArea";
import Checkbox from "~/components/shared/Checkbox";
import type { Aisle } from "~/db/shops";

type AisleSource = "none" | "auto" | "manual";

interface GroceryFormProps {
  mode: "add" | "edit";
  initialName?: string;
  initialDescription?: string;
  initialUrgent?: boolean;
  initialAmount?: number;
  initialUnit?: string;
  initialAisleId?: number | null;
  aisles: Aisle[];
  shopId: number | null;
  onSave$: (
    name: string,
    description: string,
    urgent: boolean,
    amount: number,
    unit: string,
    aisleId: number | null,
    aisleManual: boolean,
  ) => void;
  onNext$?: (
    name: string,
    description: string,
    urgent: boolean,
    amount: number,
    unit: string,
    aisleId: number | null,
    aisleManual: boolean,
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
    initialAisleId = null,
    aisles,
    shopId,
    onSave$,
    onNext$,
    onCancel$,
  }: GroceryFormProps) => {
    const formName = useSignal(initialName);
    const formDescription = useSignal(initialDescription);
    const formUrgent = useSignal(initialUrgent);
    const formAmount = useSignal<number | null>(initialAmount ?? null);
    const formUnit = useSignal(initialUnit);
    const formAisleId = useSignal<number | null>(initialAisleId);
    const aisleSource = useSignal<AisleSource>("none");
    const lastAddedName = useSignal("");

    useVisibleTask$(({ track }) => {
      const name = track(() => formName.value);
      if (mode !== "add" || shopId === null) return;
      if (aisleSource.value === "manual") return;

      // A previously auto-suggested aisle is stale once the name changes.
      if (aisleSource.value === "auto") {
        formAisleId.value = null;
        aisleSource.value = "none";
      }

      if (name.trim().length <= 2) return;
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(
            `/api/groceries/suggest-aisle?name=${encodeURIComponent(name)}&shop=${shopId}`,
          );
          if (response.ok) {
            const { aisleId } = await response.json();
            if (aisleId != null && aisleSource.value !== "manual") {
              formAisleId.value = aisleId;
              aisleSource.value = "auto";
            }
          }
        } catch (error) {
          console.error("Failed to fetch suggested aisle:", error);
        }
      }, 500);
      return () => clearTimeout(timer);
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

    const resetForm = () => {
      formName.value = "";
      formDescription.value = "";
      formUrgent.value = false;
      formAmount.value = null;
      formUnit.value = "x";
      formAisleId.value = null;
      aisleSource.value = "none";
    };

    return (
      <div
        class="p-4 bg-white dark:bg-gray-900 min-h-full"
        data-testid={mode === "add" ? "edit-form-add" : "edit-form-edit"}
      >
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          {mode === "add" ? "Dodaj pozycję" : "Edytuj pozycję"}
        </h2>
        <div class="space-y-3">
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
            autoResize
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Jednostka
              </label>
              <select
                value={formUnit.value}
                onChange$={(e) =>
                  (formUnit.value = (e.target as HTMLSelectElement).value)
                }
                data-testid="unit-select"
                class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="x">x</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
              </select>
            </div>
          </div>
          <div class="flex items-end space-x-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alejka
              </label>
              <select
                value={formAisleId.value?.toString() ?? ""}
                onChange$={(e) => {
                  const value = (e.target as HTMLSelectElement).value;
                  if (value === "") {
                    formAisleId.value = null;
                  } else {
                    formAisleId.value = Number(value);
                  }
                  aisleSource.value = "manual";
                }}
                data-testid="aisle-select"
                class="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bez alejki</option>
                {aisles.map((aisle) => (
                  <option key={aisle.id} value={aisle.id.toString()}>
                    {aisle.name}
                  </option>
                ))}
              </select>
            </div>
            <div class="pb-3">
              <Checkbox
                label="Pilne"
                checked={formUrgent.value}
                onChange$={(e) =>
                  (formUrgent.value = (e.target as HTMLInputElement).checked)
                }
                class="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
            </div>
          </div>

          {lastAddedName.value && (
            <div class="text-sm text-green-600 dark:text-green-400 font-medium animate-pulse" data-testid="form-feedback">
              Poprzednio dodano: {lastAddedName.value}
            </div>
          )}

          <div class="flex space-x-2">
            <button
              onClick$={onCancel$}
              data-testid="form-cancel-btn"
              class="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
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
                  formAisleId.value,
                  aisleSource.value === "manual",
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
                    formAisleId.value,
                    aisleSource.value === "manual",
                  );
                  resetForm();
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
        {/* Spacer: adds scroll room below the form so the auto-focused name field can scroll to the top of the viewport */}
        <div class="h-[60vh]" aria-hidden="true" />
      </div>
    );
  },
);
