import { component$, useSignal, $ } from "@builder.io/qwik";
import Loader from "~/components/shared/Loader";
import {
  HiPlusOutline,
  HiTrashOutline,
  HiCheckCircleSolid,
} from "@qwikest/icons/heroicons";
import type { PlanItem } from "~/db/plan";
import PlanItemRow from "./PlanItemRow";
import PlanForm from "./PlanForm";

interface PlanAccordionListProps {
  listId: number;
  isExpanded: boolean;
  items: PlanItem[];
  isLoading: boolean;
  formMode: "none" | "add" | "edit";
  activeItemId: number | null;
  itemConfirm: number | null;
  onItemClick$: (itemId: number) => void;
  onEditClick$: (item: PlanItem) => void;
  onRemove$: (itemId: number) => void;
  onAddClick$: () => void;
  onRemoveAll$: () => void;
  removeAllConfirm: boolean;
  onSave$: (name: string, description: string, urgent: boolean) => void;
  onNext$?: (name: string, description: string, urgent: boolean) => void;
  onCancel$: () => void;
  editingItem?: PlanItem | null;
}

export default component$(
  ({
    listId,
    isExpanded,
    items,
    isLoading,
    formMode,
    activeItemId,
    itemConfirm,
    onItemClick$,
    onEditClick$,
    onRemove$,
    onAddClick$,
    onRemoveAll$,
    removeAllConfirm,
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
                    <p class="text-lg text-gray-500">No items yet</p>
                  ) : (
                    <div class="starting:opacity-0 opacity-100 transition-opacity duration-300">
                      <ul class="space-y-2">
                        {items.map((item) => (
                          <PlanItemRow
                            key={item.id}
                            item={item}
                            isActive={activeItemId === item.id}
                            itemConfirm={itemConfirm}
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
                      class="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      <HiPlusOutline class="w-5 h-5 mr-1" />
                      <span>Add new</span>
                    </button>
                    <button
                      onClick$={onRemoveAll$}
                      disabled={items.length === 0 && !removeAllConfirm}
                      class={`flex items-center px-3 py-2 rounded ${
                        removeAllConfirm
                          ? "bg-green-500 text-white animate-bounce"
                          : items.length === 0
                            ? "bg-gray-200 text-gray-400"
                            : "bg-red-500 text-white hover:bg-red-600"
                      }`}
                      aria-label="Remove all"
                      data-testid="remove-all-btn"
                    >
                      {removeAllConfirm ? (
                        <HiCheckCircleSolid class="w-5 h-5 mr-1" />
                      ) : (
                        <HiTrashOutline class="w-5 h-5 mr-1" />
                      )}
                      <span>Remove all</span>
                    </button>
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
