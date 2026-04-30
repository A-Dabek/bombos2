import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import AllowancePage from "~/components/allowance/AllowancePage";

export default component$(() => {
  return <AllowancePage />;
});

export const head: DocumentHead = {
  title: "Allowance - Money",
};
