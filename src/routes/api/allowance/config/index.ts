import { RequestHandler } from "@builder.io/qwik-city";
import { getAllowanceConfig } from "~/db/allowance";

export const onGet: RequestHandler = async ({ json }) => {
  const config = getAllowanceConfig();
  json(200, config);
};
