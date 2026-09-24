import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ShopsList from "~/components/shops/ShopsList";

export default component$(() => {
  return <ShopsList />;
});

export const head: DocumentHead = {
  title: "Sklepy - Spożywcze",
};
