import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import BillsPage from "~/components/bills/BillsPage";

export default component$(() => {
  return <BillsPage />;
});

export const head: DocumentHead = {
  title: "Rachunki - Finanse",
};