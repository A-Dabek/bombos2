import { type RequestHandler } from "@builder.io/qwik-city";
import { runBillsPeriodStart, createAutomaticPaymentTransactions, shouldAddAutomaticPayments, getBillsConfig } from "~/db/bills";
import { getDb } from "~/db/connection";

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

  // Debug: dump transactions in current period window
  try {
    const db = getDb();
    const config = getBillsConfig();
    const today = new Date();
    const target = today.getDate() >= config.day_of_month
      ? new Date(today.getFullYear(), today.getMonth(), config.day_of_month)
      : new Date(today.getFullYear(), today.getMonth() - 1, config.day_of_month);
    const periodStartTs = Math.floor(new Date(target.getFullYear(), target.getMonth(), config.day_of_month).getTime() / 1000);
    const nextPeriodStartTs = Math.floor(new Date(target.getFullYear(), target.getMonth() + 1, config.day_of_month).getTime() / 1000);
    log(`Period window: ${periodStartTs} to ${nextPeriodStartTs}`);

    const allTx = db.prepare(
      "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions WHERE created_at >= ? AND created_at < ? ORDER BY created_at"
    ).all(periodStartTs, nextPeriodStartTs) as Array<{ id: number; description: string; amount: number; is_automatic: number; predefined_slug: string | null; created_at: number }>;
    log(`Transactions in period window: ${allTx.length}`);
    for (const tx of allTx) {
      log(`  tx id=${tx.id} desc="${tx.description}" amount=${tx.amount} auto=${tx.is_automatic} slug="${tx.predefined_slug ?? "null"}" created=${tx.created_at}`);
    }

    // Also log what shouldAddAutomaticPayments would match
    const matchingTx = db.prepare(
      "SELECT id, description, amount, is_automatic, predefined_slug, created_at FROM bills_transactions WHERE predefined_slug IS NOT NULL AND is_automatic = 1 AND created_at >= ? AND created_at < ? ORDER BY created_at"
    ).all(periodStartTs, nextPeriodStartTs);
    log(`Matching auto-payment check (predefined_slug IS NOT NULL AND is_automatic = 1): ${(matchingTx as Array<unknown>).length}`);
  } catch (err) {
    log(`Debug query error: ${err}`);
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