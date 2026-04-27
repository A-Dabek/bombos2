import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MealPage from "~/components/meals/MealPage";

export default component$(() => {
  return <MealPage category="supper" />;
});

export const head: DocumentHead = {
  title: "Supper - Meals",
};