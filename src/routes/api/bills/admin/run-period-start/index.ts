import { type RequestHandler } from "@builder.io/qwik-city";
import { runBillsPeriodStart, createAutomaticPaymentTransactions } from "~/db/bills";

export const onPost: RequestHandler = async ({ json }) => {
  const periodResult = runBillsPeriodStart();
  let paymentsCreated = 0;
  
  if (periodResult.added) {
    paymentsCreated = createAutomaticPaymentTransactions();
  }
  
  json(200, { success: true, periodAdded: periodResult.added, paymentsCreated });
};