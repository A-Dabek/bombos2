import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ParcelsPage from "../../../components/parcels/ParcelsPage";

export default component$(() => {
  return <ParcelsPage type="outgoing" title="Outgoing Parcels" />;
});

export const head: DocumentHead = {
  title: "Outgoing Parcels",
};
