import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import BillsAdmin from "~/components/bills/BillsAdmin";

export default component$(() => {
  return <BillsAdmin />;
});

export const head: DocumentHead = {
  title: "Zarządzanie rachunkami - Finanse",
};