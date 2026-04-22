import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="p-4">
      <h1 class="text-xl font-semibold">Meals</h1>
      <p class="mt-2 text-gray-600">Placeholder for meals module.</p>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Meals",
};
