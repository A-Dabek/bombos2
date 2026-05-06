import { RequestHandler } from "@builder.io/qwik-city";
import { getBillsPredefinedPayments, addBillsPredefinedPayment } from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const payments = getBillsPredefinedPayments();
  json(200, { payments });
};

export const onPost: RequestHandler = async ({ parseBody, json, error }) => {
  const body = await parseBody();
  const name = (body as any)?.name as string;
  const slug = (body as any)?.slug as string;

  if (!name || !slug) {
    throw error(400, "Valid name and slug required");
  }

  try {
    const id = addBillsPredefinedPayment({ name, slug });
    json(201, { id, name, slug });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      throw error(409, "Slug already exists");
    }
    throw error(400, err.message);
  }
};
