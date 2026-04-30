import { component$, Slot } from "@builder.io/qwik";
import MoneySubNav from "~/components/money/MoneySubNav";

export default component$(() => {
  return (
    <>
      <MoneySubNav />
      <Slot />
    </>
  );
});
