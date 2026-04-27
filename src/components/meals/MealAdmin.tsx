import { component$, useSignal, useVisibleTask$, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { HiArrowLeftSolid, HiPlusSolid, HiTrashSolid } from "@qwikest/icons/heroicons";
import type { MealRow } from "~/db/meals";

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

  const title = props.category === "dinner" ? "Dinner" : "Supper";

  return (
    <div class="min-h-screen p-4">
      <div class="flex items-center mb-4">
        <Link
          href={`/meals/${props.category}`}
          class="flex items-center text-gray-500 hover:text-gray-700"
        >
          <HiArrowLeftSolid class="w-5 h-5 mr-1" />
          <span>Back</span>
        </Link>
      </div>

      <h1 class="text-2xl font-bold text-gray-800 mb-4">{title} - Admin</h1>

      {meals.value.length === 0 ? (
        <p class="text-lg text-gray-500">No meals yet</p>
      ) : (
        <ul class="space-y-2">
          {meals.value.map((meal) => (
            <li
              key={meal.id}
              class="flex items-center justify-between p-3 bg-white border rounded"
            >
              <span class="text-gray-800">{meal.name}</span>
              <button
                onClick$={() => handleDelete(meal.id)}
                class="p-2 text-red-500 hover:text-red-700"
                aria-label="Delete"
              >
                <HiTrashSolid class="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div class="flex items-center mt-4 space-x-2">
        <input
          type="text"
          value={newMealName.value}
          onInput$={(e) => (newMealName.value = (e.target as HTMLInputElement).value)}
          placeholder="Add new dish..."
          class="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick$={handleAdd}
          class="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <HiPlusSolid class="w-5 h-5 mr-1" />
          <span>Add</span>
        </button>
      </div>
    </div>
  );
});