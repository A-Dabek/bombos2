import { component$, type PropFunction } from "@builder.io/qwik";
import type { GroceryItem } from "~/db/groceries";
import GroceryForm from "./GroceryForm";

interface PlanningFormViewProps {
  formMode: "none" | "add" | "edit";
  editingItem: GroceryItem | null;
  onSave$: PropFunction<(
    name: string,
    description: string,
    urgent: boolean,
    amount: number,
    unit: string,
  ) => void>;
  onNext$: PropFunction<(
    name: string,
    description: string,
    urgent: boolean,
    amount: number,
    unit: string,
  ) => void>;
  onCancel$: PropFunction<() => void>;
}

export default component$(
  ({
    formMode,
    editingItem,
    onSave$,
    onNext$,
    onCancel$,
  }: PlanningFormViewProps) => {
    return (
      <div
        class={`${
          formMode !== "none" ? "relative" : "absolute"
        } top-0 left-0 w-full transition-transform duration-300 ease-in-out bg-white ${
          formMode !== "none" ? "translate-x-0" : "translate-x-full"
        }`}
        style={formMode !== "none" ? "min-height: 200px;" : ""}
      >
        {formMode !== "none" && (
          <GroceryForm
            mode={formMode as "add" | "edit"}
            initialName={
              formMode === "edit" && editingItem ? editingItem.name : ""
            }
            initialDescription={
              formMode === "edit" && editingItem
                ? editingItem.description || ""
                : ""
            }
            initialUrgent={
              formMode === "edit" && editingItem
                ? editingItem.urgent
                : false
            }
            initialAmount={
              formMode === "edit" && editingItem
                ? editingItem.amount
                : undefined
            }
            initialUnit={
              formMode === "edit" && editingItem
                ? editingItem.unit
                : "x"
            }
            onSave$={onSave$}
            onNext$={onNext$}
            onCancel$={onCancel$}
          />
        )}
      </div>
    );
  },
);
