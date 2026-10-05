import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import GroceriesAdmin from "~/components/groceries/admin/GroceriesAdmin";

export default component$(() => <GroceriesAdmin />);

export const head: DocumentHead = { title: "Scalanie produktów - Spożywcze" };
