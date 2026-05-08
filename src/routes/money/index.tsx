import { component$, useVisibleTask$ } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import type { DocumentHead } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ redirect }) => {
  throw redirect(302, "/money/balance");
};
