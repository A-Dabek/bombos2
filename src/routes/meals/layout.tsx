import { component$, Slot } from "@builder.io/qwik";
import MealSubNav from "~/components/meals/MealSubNav";

export default component$(() => {
  return (
    <>
      <MealSubNav />
      <Slot />
    </>
  );
});