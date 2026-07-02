import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import FlowsPage from "~/components/money/flows/FlowsPage";

export default component$(() => {
  return <FlowsPage />;
});

export const head: DocumentHead = {
  title: "Przepływy - Finanse",
};
