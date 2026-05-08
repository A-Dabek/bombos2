import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import BalancePage from "~/components/balance/BalancePage";

export default component$(() => {
  return <BalancePage />;
});

export const head: DocumentHead = {
  title: "Wydatki - Finanse",
};
