import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ParcelsPage from "../../../components/parcels/ParcelsPage";

export default component$(() => {
  return <ParcelsPage type="incoming" title="Incoming Parcels" />;
});

export const head: DocumentHead = {
  title: "Incoming Parcels",
};
