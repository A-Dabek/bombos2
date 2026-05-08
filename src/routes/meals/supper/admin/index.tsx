import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import MealAdmin from "~/components/meals/MealAdmin";

export default component$(() => {
  return <MealAdmin category="supper" />;
});

export const head: DocumentHead = {
  title: "Zarządzanie kolacją - Posiłki",
};