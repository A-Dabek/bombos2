import { RequestHandler } from "@builder.io/qwik-city";
import { getAutomaticPaymentsForPeriod } from "~/db/bills";

export const onGet: RequestHandler = async ({ json, query, error }) => {
  const startStr = query.get("start");
  const endStr = query.get("end");

  if (startStr === null || endStr === null) {
    throw error(400, "start and end query params required");
  }

  const start = Number(startStr);
  const end = Number(endStr);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw error(400, "Valid numeric start and end timestamps (start < end) required");
  }

  const transactions = getAutomaticPaymentsForPeriod(start, end);
  json(200, { transactions });
};