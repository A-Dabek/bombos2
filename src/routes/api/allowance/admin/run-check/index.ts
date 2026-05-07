import { type RequestHandler } from "@builder.io/qwik-city";
import { runAllowance } from "~/db/allowance";

export const onPost: RequestHandler = async ({ json }) => {
  const result = runAllowance();
  json(200, { success: true, ...result });
};