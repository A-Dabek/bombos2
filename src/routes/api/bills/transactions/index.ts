import { RequestHandler } from "@builder.io/qwik-city";
import { addBillTransaction, getBillTransactionsGroupedByPeriod } from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const groups = getBillTransactionsGroupedByPeriod();
  json(200, { groups });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);
  const predefined_slug = (body as any)?.predefined_slug as string | undefined;

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  const id = addBillTransaction(description, amount, false, predefined_slug || undefined);
  json(201, { id, description, amount, predefined_slug: predefined_slug || null });
};