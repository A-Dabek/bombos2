import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import PlanningList from "~/components/groceries/PlanningList";

export default component$(() => {
  return <PlanningList />;
});

export const head: DocumentHead = {
  title: "Planowanie - Spożywcze",
};
