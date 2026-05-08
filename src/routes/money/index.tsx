import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const nav = useNavigate();

  useVisibleTask$(() => {
    nav("/money/balance");
  });

  return null;
});

export const head: DocumentHead = {
  title: "Finanse",
};
