import { RequestHandler } from "@builder.io/qwik-city";
import { getBillsConfig } from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const config = getBillsConfig();
  json(200, config);
};