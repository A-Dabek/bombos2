import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import AllowanceAdmin from "~/components/allowance/AllowanceAdmin";

export default component$(() => {
  return <AllowanceAdmin />;
});

export const head: DocumentHead = {
  title: "Allowance Admin - Money",
};
