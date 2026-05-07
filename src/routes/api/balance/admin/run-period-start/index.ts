import { type RequestHandler } from "@builder.io/qwik-city";
import { runBalancePeriodStart } from "~/db/balance";

export const onPost: RequestHandler = async ({ json }) => {
  const result = runBalancePeriodStart();
  json(200, { success: true, added: result.added });
};