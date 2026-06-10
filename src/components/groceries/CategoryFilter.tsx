import { component$, type PropFunction } from "@builder.io/qwik";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  completedCategories: string[];
  onSelect$: PropFunction<(category: string) => void>;
}

export default component$(
  ({
    categories,
    selectedCategory,
    completedCategories,
    onSelect$,
  }: CategoryFilterProps) => {
    return (
      <div class="flex overflow-x-auto pb-4 mb-2 no-scrollbar">
        <div class="flex space-x-2">
          {categories.map((category) => {
            const isCompleted = completedCategories.includes(category);
            const isSelected = selectedCategory === category;

            return (
              <button
                key={category}
                onClick$={() => onSelect$(category)}
                class={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : isCompleted
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category === "All" ? "Wszystkie" : category}
                {isCompleted && " ✓"}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
