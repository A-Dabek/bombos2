import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import PlanLists from "~/components/plan/PlanLists";

export default component$(() => {
  return <PlanLists />;
});

export const head: DocumentHead = {
  title: "Listy - Plan",
};