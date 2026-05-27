import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ShoppingList from "~/components/groceries/ShoppingList";

export default component$(() => {
  return <ShoppingList />;
});

export const head: DocumentHead = {
  title: "Zakupy - Spożywcze",
};
