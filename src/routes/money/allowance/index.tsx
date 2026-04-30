import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <div class="p-4">
      <h1 class="text-xl font-semibold">Allowance</h1>
      <p class="mt-2 text-gray-600">Allowance coming soon.</p>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Allowance - Money",
};
