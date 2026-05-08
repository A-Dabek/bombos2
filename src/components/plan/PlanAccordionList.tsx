import { component$ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import { HiPlusOutline } from "@qwikest/icons/heroicons";
import type { PlanItem } from "~/db/plan";
import PlanItemRow from "./PlanItemRow";
import PlanForm from "./PlanForm";
import DoubleConfirmButton from "../shared/DoubleConfirmButton";

interface PlanAccordionListProps {
  listId: number;
  isExpanded: boolean;
  items: PlanItem[];
  isLoading: boolean;
  formMode: "none" | "add" | "edit";
  activeItemId: number | null;
  onItemClick$: (itemId: number) => void;
  onEditClick$: (item: PlanItem) => void;
  onRemove$: (itemId: number) => void;
  onAddClick$: () => void;
  onRemoveAll$: () => void;
  onSave$: (name: string, description: string, urgent: boolean) => void;
  onNext$?: (name: string, description: string, urgent: boolean) => void;
  onCancel$: () => void;
  editingItem?: PlanItem | null;
}

export default component$(
  ({
    isExpanded,
    items,
    isLoading,
    formMode,
    activeItemId,
    onItemClick$,
    onEditClick$,
    onRemove$,
    onAddClick$,
    onRemoveAll$,
    onSave$,
    onNext$,
    onCancel$,
    editingItem,
  }: PlanAccordionListProps) => {
    return (
      <div
        class={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isExpanded
            ? formMode !== "none"
              ? "max-h-[2000px]"
              : "max-h-[1000px]"
            : "max-h-0"
        }`}
      >
        <div class="relative" style="min-height: 100px;">
          {/* Items View */}
          <div
            class={`transition-transform duration-300 ease-in-out ${
              formMode === "none" ? "translate-x-0" : "-translate-x-full hidden"
            }`}
          >
            <div class="p-4">
              {isLoading ? (
                <div class="flex justify-center py-4">
                  <Loader size="sm" color="border-blue-500" />
                </div>
              ) : (
                <>
                  {items.length === 0 ? (
                    <p class="text-lg text-gray-500">Brak pozycji</p>
                  ) : (
                    <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
                      <ul class="space-y-2">
                        {items.map((item) => (
                          <PlanItemRow
                            key={item.id}
                            item={item}
                            isActive={activeItemId === item.id}
                            onItemClick$={onItemClick$}
                            onEditClick$={onEditClick$}
                            onRemove$={onRemove$}
                          />
                        ))}
                      </ul>
                    </div>
                  )}

                  <div class="flex space-x-2 mt-4">
                    <button
                      onClick$={onAddClick$}
                      data-testid="add-item-btn"
                      class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <HiPlusOutline class="w-5 h-5 mr-1" />
                      <span>Nowy</span>
                    </button>
                    <DoubleConfirmButton
                      onConfirm$={onRemoveAll$}
                      disabled={items.length === 0}
                      text="Usuń wszystkie"
                      class={`px-3 py-2 rounded ${items.length === 0 ? "bg-gray-200 text-gray-400" : ""}`}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Form View - slides in from right */}
          <div
            class={`${
              formMode !== "none" ? "relative" : "absolute"
            } top-0 left-0 w-full transition-transform duration-300 ease-in-out bg-white ${
              formMode !== "none" ? "translate-x-0" : "translate-x-full"
            }`}
            style={formMode !== "none" ? "min-height: 200px;" : ""}
          >
            {formMode !== "none" && (
              <PlanForm
                mode={formMode}
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
                onSave$={onSave$}
                onNext$={onNext$}
                onCancel$={onCancel$}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);
