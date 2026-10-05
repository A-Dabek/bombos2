import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import AdminButton from "~/components/shared/AdminButton";
import PlanningList from "~/components/groceries/PlanningList";

export default component$(() => {
  return (
    <>
      <AdminButton href="/groceries/admin" />
      <PlanningList />
    </>
  );
});

export const head: DocumentHead = {
  title: "Planowanie - Spożywcze",
};
