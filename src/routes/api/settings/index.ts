import { RequestHandler } from "@builder.io/qwik-city";
import { getHiddenTabs, setHiddenTabs } from "~/db/settings";

export const onGet: RequestHandler = async ({ json, sharedMap }) => {
  const email = (sharedMap.get("userEmail") as string) ?? "default";
  const hiddenTabs = getHiddenTabs(email);
  json(200, { hiddenTabs });
};

export const onPost: RequestHandler = async ({ parseBody, json, error, sharedMap }) => {
  const email = (sharedMap.get("userEmail") as string) ?? "default";
  const body = await parseBody();
  const hiddenTabs = (body as any)?.hiddenTabs;

  if (!Array.isArray(hiddenTabs) || !hiddenTabs.every((t) => typeof t === "string")) {
    throw error(400, "hiddenTabs must be an array of strings");
  }

  setHiddenTabs(email, hiddenTabs);
  json(200, { hiddenTabs });
};
