import { RequestHandler } from "@builder.io/qwik-city";
import { addBalanceTransaction, getBalanceTransactions } from "~/db/balance";

export const onGet: RequestHandler = async ({ json }) => {
  const transactions = getBalanceTransactions();
  json(200, { transactions });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  const id = addBalanceTransaction(description, amount, false);
  json(201, { id, description, amount });
};