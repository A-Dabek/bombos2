import { RequestHandler } from "@builder.io/qwik-city";
import {
  getTransactionsGroupedByPeriod,
  addAllowanceTransaction,
  getCurrentBalance,
  getLastTransactionId,
} from "~/db/allowance";

export const onGet: RequestHandler = async ({ json }) => {
  const groups = getTransactionsGroupedByPeriod();
  const balance = getCurrentBalance();
  const lastTransactionId = getLastTransactionId();
  json(200, { groups, balance, lastTransactionId });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const description = (body as any)?.description as string;
  const amount = Number((body as any)?.amount);
  const type = (body as any)?.type as "allowance" | "expense" | "income"
    || (amount > 0 ? "income" : "expense");

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  if (!["allowance", "expense", "income"].includes(type)) {
    throw error(400, "Invalid transaction type");
  }

  const id = addAllowanceTransaction(type, description, Math.abs(amount));
  const balance = getCurrentBalance();
  json(201, { id, type, description, amount: Math.abs(amount), balance });
};
