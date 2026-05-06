import { RequestHandler } from "@builder.io/qwik-city";
import { deleteBillsAutomaticPayment } from "~/db/bills";

export const onDelete: RequestHandler = async ({ json, error, params }) => {
  const id = Number(params?.id);
  
  if (isNaN(id)) {
    throw error(400, "Valid payment ID required");
  }

  deleteBillsAutomaticPayment(id);
  json(200, { success: true });
};