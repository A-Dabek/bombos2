import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MealRandomizer from "~/components/meals/MealRandomizer";

export default component$(() => {
  return <MealRandomizer category="dinner" />;
});

export const head: DocumentHead = {
  title: "Dinner - Meals",
};