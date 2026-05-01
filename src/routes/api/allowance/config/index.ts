import { RequestHandler } from "@builder.io/qwik-city";
import { getAllowanceConfig, updateAllowanceConfig } from "~/db/allowance";

export const onGet: RequestHandler = async ({ json }) => {
  const config = getAllowanceConfig();
  json(200, config);
};

export const onPost: RequestHandler = async ({ json, error, parseBody }) => {
  const body = await parseBody();
  const day_of_month = Number((body as any).day_of_month);
  const monthly_amount = Number((body as any).monthly_amount);

  if (isNaN(day_of_month) || day_of_month < 1 || day_of_month > 28) {
    throw error(400, "day_of_month must be between 1 and 28");
  }
  if (isNaN(monthly_amount) || monthly_amount < 0) {
    throw error(400, "monthly_amount must be a positive number");
  }

  const config = updateAllowanceConfig(day_of_month, monthly_amount);
  json(200, config);
};
