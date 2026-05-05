import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import BalanceAdmin from "~/components/balance/BalanceAdmin";

export default component$(() => {
  return <BalanceAdmin />;
});

export const head: DocumentHead = {
  title: "Balance Admin - Money",
};