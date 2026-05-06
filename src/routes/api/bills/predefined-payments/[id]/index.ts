import { RequestHandler } from "@builder.io/qwik-city";
import { deleteBillsPredefinedPayment } from "~/db/bills";

export const onDelete: RequestHandler = async ({ params, json, error }) => {
  const id = Number(params.id);
  if (isNaN(id)) {
    throw error(400, "Invalid ID");
  }

  try {
    deleteBillsPredefinedPayment(id);
    json(200, { success: true });
  } catch (err: any) {
    throw error(500, err.message);
  }
};
