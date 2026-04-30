import { RequestHandler } from "@builder.io/qwik-city";
import {
  getAllowanceTransactions,
  addAllowanceTransaction,
  getCurrentBalance,
} from "~/db/allowance";

export const onGet: RequestHandler = async ({ json }) => {
  const transactions = getAllowanceTransactions();
  const balance = getCurrentBalance();
  json(200, { transactions, balance });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  const type = amount > 0 ? "income" as const : "expense" as const;
  const id = addAllowanceTransaction(type, description, Math.abs(amount));
  const transaction = getAllowanceTransactions().find((t) => t.id === id);
  json(201, transaction);
};
