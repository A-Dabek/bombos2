import { RequestHandler } from "@builder.io/qwik-city";
import { addBillTransaction, getBillTransactionsGroupedByPeriod } from "~/db/bills";
import { paginateGroups } from "~/db/pagination";

export const onGet: RequestHandler = async ({ json, query }) => {
  const groups = getBillTransactionsGroupedByPeriod();

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
  const predefined_slug = (body as any)?.predefined_slug as string | undefined;

  if (!description || isNaN(amount) || amount === 0) {
    throw error(400, "Valid description and non-zero amount required");
  }

  const id = addBillTransaction(description, amount, false, predefined_slug || undefined);
  json(201, { id, description, amount, predefined_slug: predefined_slug || null });
};