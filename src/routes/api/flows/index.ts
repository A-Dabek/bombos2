import { RequestHandler } from "@builder.io/qwik-city";
import { getMoneyFlows, addMoneyFlow } from "~/db/flows";

export const onGet: RequestHandler = async ({ json }) => {
  const flows = getMoneyFlows();
  json(200, { flows });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);
  const dayOfMonth = Number((body as any)?.dayOfMonth);

  if (!description || isNaN(amount) || isNaN(dayOfMonth)) {
    throw error(400, "Valid description, amount and day of month required");
  }

  const id = addMoneyFlow(description, amount, dayOfMonth);
  json(201, { id, description, amount, dayOfMonth });
};
