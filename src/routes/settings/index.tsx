import { component$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import SettingsPage from "~/components/settings/SettingsPage";

export default component$(() => {
  return <SettingsPage />;
});

export const head: DocumentHead = {
  title: "Personalizacja",
};
