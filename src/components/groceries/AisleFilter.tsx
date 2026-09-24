import { component$, type PropFunction } from "@builder.io/qwik";

export interface AisleFilterOption {
  value: string;
  label: string;
  completed: boolean;
}

interface AisleFilterProps {
  options: AisleFilterOption[];
  selected: string;
  onSelect$: PropFunction<(value: string) => void>;
}

export default component$(
  ({ options, selected, onSelect$ }: AisleFilterProps) => {
    return (
      <div class="flex overflow-x-auto pb-4 mb-2 no-scrollbar">
        <div class="flex space-x-2">
          {options.map((option) => {
            const isSelected = selected === option.value;

            return (
              <button
                key={option.value}
                onClick$={() => onSelect$(option.value)}
                class={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : option.completed
                      ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {option.label}
                {option.completed && " ✓"}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
