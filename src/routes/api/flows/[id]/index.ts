import { RequestHandler } from "@builder.io/qwik-city";
import { updateMoneyFlow, deleteMoneyFlow } from "~/db/flows";

export const onPut: RequestHandler = async ({ params, parseBody, json, error }) => {
  const id = Number(params.id);
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);
  const dayOfMonth = Number((body as any)?.dayOfMonth);

  if (isNaN(id) || !description || isNaN(amount) || isNaN(dayOfMonth)) {
    throw error(400, "Valid id, description, amount and day of month required");
  }

  const success = updateMoneyFlow(id, description, amount, dayOfMonth);
  if (!success) throw error(404, "Flow not found");

  json(200, { success });
};

export const onDelete: RequestHandler = async ({ params, json, error }) => {
  const id = Number(params.id);
  if (isNaN(id)) throw error(400, "Valid id required");

  const success = deleteMoneyFlow(id);
  if (!success) throw error(404, "Flow not found");

  json(200, { success });
};
