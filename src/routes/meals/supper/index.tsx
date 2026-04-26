import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MealRandomizer from "~/components/meals/MealRandomizer";

export default component$(() => {
  return <MealRandomizer category="supper" />;
});

export const head: DocumentHead = {
  title: "Supper - Meals",
};