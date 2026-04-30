import { RequestHandler } from "@builder.io/qwik-city";
import { getDb } from "~/db/connection";
import { deleteLastTransaction } from "~/db/allowance";

export const onDelete: RequestHandler = async ({ params, json, error }) => {
  const id = Number(params.id);

  // Check if this is the last transaction (highest id)
  const db = getDb();
  const lastRow = db.prepare(
    "SELECT id FROM allowance_transactions ORDER BY id DESC LIMIT 1",
  ).raw(true).get() as unknown[][];

  if (!lastRow) {
    return error(404, "No transactions found");
  }

  const lastId = lastRow[0] as number;
  if (id !== lastId) {
    return error(400, "Only the last transaction can be deleted");
  }

  const result = deleteLastTransaction(db);
  if (!result.success) {
    return error(400, "Failed to delete transaction");
  }

  json(200, { success: true, newBalance: result.newBalance });
};
