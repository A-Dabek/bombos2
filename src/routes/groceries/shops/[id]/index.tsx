import { component$ } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";
import ShopDetail from "~/components/shops/ShopDetail";

export default component$(() => {
  const loc = useLocation();
  const id = parseInt(loc.params.id, 10);

  if (isNaN(id)) {
    return (
      <p class="p-4 text-lg text-gray-500 dark:text-gray-400">
        Nie znaleziono sklepu.
      </p>
    );
  }

  return <ShopDetail shopId={id} />;
});

export const head: DocumentHead = {
  title: "Sklep - Spożywcze",
};
