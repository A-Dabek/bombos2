import { RequestHandler } from "@builder.io/qwik-city";
import { getHiddenTabs, setHiddenTabs, getTheme, setTheme } from "~/db/settings";

export const onGet: RequestHandler = async ({ json, sharedMap }) => {
  const email = (sharedMap.get("userEmail") as string) ?? "default";
  const hiddenTabs = getHiddenTabs(email);
  const theme = getTheme(email);
  json(200, { hiddenTabs, theme });
};

export const onPost: RequestHandler = async ({ parseBody, json, error, sharedMap }) => {
  const email = (sharedMap.get("userEmail") as string) ?? "default";
  const body = (await parseBody()) as any;
  const hiddenTabs = body?.hiddenTabs;
  const theme = body?.theme;

  if (hiddenTabs === undefined && theme === undefined) {
    throw error(400, "At least one of hiddenTabs or theme must be provided");
  }

  if (hiddenTabs !== undefined) {
    if (!Array.isArray(hiddenTabs) || !hiddenTabs.every((t) => typeof t === "string")) {
      throw error(400, "hiddenTabs must be an array of strings");
    }
    setHiddenTabs(email, hiddenTabs);
  }

  if (theme !== undefined) {
    if (theme !== "dark" && theme !== "light") {
      throw error(400, "theme must be 'dark' or 'light'");
    }
    setTheme(email, theme);
  }

  json(200, {
    hiddenTabs: getHiddenTabs(email),
    theme: getTheme(email),
  });
};
