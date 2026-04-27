import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import PlanListItems from "~/components/plan/PlanListItems";

export default component$(() => {
  return <PlanListItems />;
});

export const head: DocumentHead = {
  title: "Plan List",
};