import { RequestHandler } from "@builder.io/qwik-city";
import { getBalanceConfig, updateBalanceConfig } from "~/db/balance";

export const onGet: RequestHandler = async ({ json }) => {
  const config = getBalanceConfig();
  json(200, config);
};

export const onPost: RequestHandler = async ({ json, error, parseBody }) => {
  const body = await parseBody();
  const day_of_month = Number((body as any).day_of_month);

  if (isNaN(day_of_month) || day_of_month < 1 || day_of_month > 28) {
    throw error(400, "day_of_month must be between 1 and 28");
  }

  const config = updateBalanceConfig(day_of_month);
  json(200, config);
};