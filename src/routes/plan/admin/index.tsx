import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import PlanAdmin from "~/components/plan/PlanAdmin";

export default component$(() => {
  return <PlanAdmin />;
});

export const head: DocumentHead = {
  title: "Zarządzanie - Plan",
};