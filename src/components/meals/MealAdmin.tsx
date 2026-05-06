import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import { HiPlusSolid } from "@qwikest/icons/heroicons";
import BackButton from "~/components/shared/BackButton";
import type { MealRow } from "~/db/meals";
import MealAdminItem from "./MealAdminItem";

interface MealAdminProps {
  category: "dinner" | "supper";
}

export default component$<MealAdminProps>((props) => {
  const meals = useSignal<MealRow[]>([]);
  const newMealName = useSignal("");
  const loc = useLocation();

  // Fetch meals on mount
  useVisibleTask$(async ({ track }) => {
    track(() => props.category);

    const response = await fetch(`/api/meals/${props.category}`);
    const data = await response.json();
    // Sort by id descending (newest first)
    meals.value = data.sort((a: MealRow, b: MealRow) => b.id - a.id);
  });

  const handleAdd = $(async () => {
    const name = newMealName.value.trim();
    if (!name) return;

    const response = await fetch(`/api/meals/${props.category}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (response.ok) {
      const result = await response.json();
      // Prepend new meal to list
      meals.value = [
        { id: result.id, category: props.category, name },
        ...meals.value,
      ];
      newMealName.value = "";
    }
  });

  const handleDelete = $(async (id: number) => {
    const response = await fetch(`/api/meals/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      meals.value = meals.value.filter((m) => m.id !== id);
    }
  });

  return (
    <div class="min-h-screen p-4" data-testid="meal-admin">
       <BackButton href={`/meals/${props.category}`} />

      <div class="flex items-center mb-4 space-x-2">
        <input
          type="text"
          data-testid="meal-admin-input"
          value={newMealName.value}
          onInput$={(e) => (newMealName.value = (e.target as HTMLInputElement).value)}
          placeholder="Add new dish..."
          class="flex-1 px-3 py-2 border rounded"
        />
        <button
          data-testid="meal-admin-add"
          onClick$={handleAdd}
          class="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <HiPlusSolid class="w-5 h-5 mr-1" />
          <span>Add</span>
        </button>
      </div>

      {meals.value.length === 0 ? (
        <p class="text-lg text-gray-500">No meals yet</p>
      ) : (
        <ul>
          {meals.value.map((meal) => (
            <MealAdminItem
              key={meal.id}
              meal={meal}
              onDelete$={handleDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
});