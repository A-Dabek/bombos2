import { RequestHandler } from "@builder.io/qwik-city";
import { getBalanceConfig } from "~/db/balance";

export const onGet: RequestHandler = async ({ json }) => {
  const config = getBalanceConfig();
  json(200, config);
};