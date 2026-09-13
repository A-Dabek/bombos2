import { RequestHandler } from "@builder.io/qwik-city";
import {
  getTransactionsGroupedByPeriod,
  addAllowanceTransaction,
  getCurrentBalance,
  getLastTransactionId,
} from "~/db/allowance";
import { paginateGroups } from "~/db/pagination";

export const onGet: RequestHandler = async ({ json, query }) => {
  const groups = getTransactionsGroupedByPeriod();
  const balance = getCurrentBalance();
  const lastTransactionId = getLastTransactionId();

  if (query.has("limit")) {
    const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 1));
    const offset = Math.max(0, Number(query.get("offset")) || 0);
    const page = paginateGroups(groups, limit, offset);
    json(200, { groups: page.groups, hasMore: page.hasMore, balance, lastTransactionId });
    return;
  }

  json(200, { groups, balance, lastTransactionId, hasMore: false });
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
