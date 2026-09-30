import { RequestHandler } from "@builder.io/qwik-city";
import {
  getHiddenTabs,
  setHiddenTabs,
  getTheme,
  setTheme,
  getActiveShop,
  setActiveShop,
  getInventoryWindowDays,
  setInventoryWindowDays,
} from "~/db/settings";

export const onGet: RequestHandler = async ({ json, sharedMap }) => {
  const email = (sharedMap.get("userEmail") as string) ?? "default";
  const hiddenTabs = getHiddenTabs(email);
  const theme = getTheme(email);
  const activeShop = getActiveShop(email);
  const inventoryWindowDays = getInventoryWindowDays(email);
  json(200, { hiddenTabs, theme, activeShop, inventoryWindowDays });
};

export const onPost: RequestHandler = async ({ parseBody, json, error, sharedMap }) => {
  const email = (sharedMap.get("userEmail") as string) ?? "default";
  const body = (await parseBody()) as any;
  const hiddenTabs = body?.hiddenTabs;
  const theme = body?.theme;
  const activeShop = body?.activeShop;
  const inventoryWindowDays = body?.inventoryWindowDays;

  if (
    hiddenTabs === undefined &&
    theme === undefined &&
    activeShop === undefined &&
    inventoryWindowDays === undefined
  ) {
    throw error(
      400,
      "At least one of hiddenTabs, theme, activeShop or inventoryWindowDays must be provided",
    );
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

  if (activeShop !== undefined) {
    if (typeof activeShop !== "number" || !Number.isInteger(activeShop)) {
      throw error(400, "activeShop must be an integer");
    }
    setActiveShop(activeShop);
  }

  if (inventoryWindowDays !== undefined) {
    if (
      typeof inventoryWindowDays !== "number" ||
      !Number.isInteger(inventoryWindowDays) ||
      inventoryWindowDays < 1 ||
      inventoryWindowDays > 15
    ) {
      throw error(400, "inventoryWindowDays must be an integer between 1 and 15");
    }
    setInventoryWindowDays(inventoryWindowDays);
  }

  json(200, {
    hiddenTabs: getHiddenTabs(email),
    theme: getTheme(email),
    activeShop: getActiveShop(email),
    inventoryWindowDays: getInventoryWindowDays(email),
  });
};
