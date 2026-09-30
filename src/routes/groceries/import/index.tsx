import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import ImportWizard from "~/components/groceries/import/ImportWizard";

export default component$(() => {
  return <ImportWizard />;
});

export const head: DocumentHead = {
  title: "Import ze zdjęcia - Spożywcze",
};
