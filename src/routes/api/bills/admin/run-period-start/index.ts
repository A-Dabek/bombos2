import { type RequestHandler } from "@builder.io/qwik-city";
import { runBillsPeriodStart, createAutomaticPaymentTransactions, shouldAddAutomaticPayments } from "~/db/bills";

function log(message: string): void {
  console.log(`[run-period-start] ${new Date().toISOString()} ${message}`);
}

export const onPost: RequestHandler = async ({ json }) => {
  log("Manual trigger: running bills period-start");

  const periodResult = runBillsPeriodStart();
  if (periodResult.added) {
    log("Period-start marker added.");
  } else {
    log("Period-start marker already exists, skipping.");
  }

  let paymentsCreated = 0;

  if (shouldAddAutomaticPayments()) {
    paymentsCreated = createAutomaticPaymentTransactions();
    log(`Created ${paymentsCreated} automatic payment transactions.`);
  } else {
    log("Automatic payments already exist for this period, skipping.");
  }

  json(200, { success: true, periodAdded: periodResult.added, paymentsCreated });
};