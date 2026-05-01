import { RequestHandler } from "@builder.io/qwik-city";
import { getLastTransactionId, deleteLastTransaction } from "~/db/allowance";

export const onDelete: RequestHandler = async ({ params, json, error }) => {
  const id = Number(params.id);

  // Check if this is the last transaction (highest id)
  const lastId = getLastTransactionId();
  if (lastId === null) {
    throw error(404, "No transactions found");
  }

  if (id !== lastId) {
    throw error(400, "Only the last transaction can be deleted");
  }

  const result = deleteLastTransaction();
  if (!result.success) {
    throw error(400, "Failed to delete transaction");
  }

  json(200, { success: true, newBalance: result.newBalance });
};
