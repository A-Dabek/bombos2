import { RequestHandler } from "@builder.io/qwik-city";
import { 
  getBillsAutomaticPayments, 
  addBillsAutomaticPayment 
} from "~/db/bills";

export const onGet: RequestHandler = async ({ json }) => {
  const payments = getBillsAutomaticPayments();
  json(200, { payments });
};

export const onPost: RequestHandler = async ({ json, error, parseBody }) => {
  const body = await parseBody();
  const name = (body as any)?.name as string;
  const slug = (body as any)?.slug as string;
  const amount = Number((body as any)?.amount);

  if (!name || !slug || isNaN(amount) || amount <= 0) {
    throw error(400, "Valid name, slug, and positive amount required");
  }

  try {
    const id = addBillsAutomaticPayment({ name, slug, amount });
    json(201, { id, name, slug, amount });
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      throw error(409, "Slug already exists");
    }
    throw error(400, err.message);
  }
};