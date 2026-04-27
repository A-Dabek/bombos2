import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MealAdmin from "~/components/meals/MealAdmin";

export default component$(() => {
  return <MealAdmin category="dinner" />;
});

export const head: DocumentHead = {
  title: "Dinner Admin - Meals",
};