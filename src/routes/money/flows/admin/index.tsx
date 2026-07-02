import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import FlowsAdmin from "~/components/money/flows/FlowsAdmin";

export default component$(() => {
  return <FlowsAdmin />;
});

export const head: DocumentHead = {
  title: "Zarządzaj przepływami - Finanse",
};
