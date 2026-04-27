import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { HiCog6ToothSolid } from "@qwikest/icons/heroicons";
import type { PlanList } from "~/db/plan";

export default component$(() => {
  const lists = useSignal<PlanList[]>([]);
  const isLoaded = useSignal(false);

  useVisibleTask$(async () => {
    try {
      const response = await fetch("/api/plan/lists");
      if (response.ok) {
        const data = await response.json();
        lists.value = data;
      } else {
        console.error("API error:", response.status);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
    isLoaded.value = true;
  });

  return (
    <div class="min-h-screen">
      {isLoaded.value && lists.value.length === 0 ? (
        <p class="text-lg text-gray-500 px-4">No lists yet</p>
      ) : (
        <ul class="divide-y divide-gray-200">
          {lists.value.map((list) => (
            <li key={list.id}>
              <Link
                href={`/plan/${list.id}`}
                class="block px-4 py-3 hover:bg-gray-50"
              >
                <span class="text-lg text-gray-800">{list.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/plan/admin"
        class="fixed bottom-4 right-4 flex items-center justify-center w-14 h-14 bg-red-500 rounded-full shadow-lg"
        aria-label="Admin"
      >
        <HiCog6ToothSolid class="w-7 h-7 text-white" />
      </Link>
    </div>
  );
});
