import { component$, useNavigate } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  const nav = useNavigate();
  const loc = useLocation();

  if (loc.url.pathname === "/money" || loc.url.pathname === "/money/") {
    nav("/money/allowance");
  }

  return null;
});

export const head: DocumentHead = {
  title: "Money",
};
