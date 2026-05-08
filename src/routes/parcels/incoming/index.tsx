import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ParcelsPage from "../../../components/parcels/ParcelsPage";

export default component$(() => {
  return <ParcelsPage type="incoming" title="Paczki do odbioru" />;
});

export const head: DocumentHead = {
  title: "Paczki do odbioru",
};
