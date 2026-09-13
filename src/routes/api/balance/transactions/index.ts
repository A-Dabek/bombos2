import { RequestHandler } from "@builder.io/qwik-city";
import { addBalanceTransaction, getBalanceTransactionsGroupedByPeriod } from "~/db/balance";
import { paginateGroups } from "~/db/pagination";

export const onGet: RequestHandler = async ({ json, query }) => {
  const groups = getBalanceTransactionsGroupedByPeriod();

  if (query.has("limit")) {
    const limit = Math.min(100, Math.max(1, Number(query.get("limit")) || 1));
    const offset = Math.max(0, Number(query.get("offset")) || 0);
    const page = paginateGroups(groups, limit, offset);
    json(200, { groups: page.groups, hasMore: page.hasMore });
    return;
  }

  json(200, { groups, hasMore: false });
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