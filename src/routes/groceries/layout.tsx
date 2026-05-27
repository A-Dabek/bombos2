import { component$, Slot } from "@builder.io/qwik";
import GroceriesSubNav from "~/components/groceries/GroceriesSubNav";

export default component$(() => {
  return (
    <>
      <GroceriesSubNav />
      <Slot />
    </>
  );
});
