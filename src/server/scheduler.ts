import cron from "node-cron";
import { deleteCompletedParcels } from "../db/parcels.ts";
import { shouldAddAllowance, runAllowance } from "../db/allowance.ts";
import { shouldAddBillsPeriodStart, runBillsPeriodStart, createAutomaticPaymentTransactions, shouldAddAutomaticPayments } from "../db/bills.ts";
import { shouldAddBalancePeriodStart, runBalancePeriodStart } from "../db/balance.ts";

let started = false;

function log(label: string, message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[scheduler] [${timestamp}] [${label}] ${message}`);
}

export function runCleanup(): void {
  log("cleanup", "Starting cleanup of completed parcels");
  try {
    const deleted = deleteCompletedParcels();
    log("cleanup", `Deleted ${deleted} completed parcels`);
  } catch (err) {
    log("error", `Failed to clean up completed parcels: ${err}`);
  }
}

export function runAllowanceCheck(): void {
  log("allowance", "Checking if allowance should be added");
  if (shouldAddAllowance()) {
    log("allowance", "Scheduler triggered: adding allowance");
    try {
      const result = runAllowance();
      if (result.added) {
        log("allowance", `Added allowance. New balance: ${result.newBalance}`);
      }
    } catch (err) {
      log("error", `Failed to run allowance: ${err}`);
    }
  } else {
    log("allowance", "Not the configured day, skipping");
  }
}

function runPeriodStartChecks(): void {
  log("period-start", "Checking if period-start transactions should be added");

  // Period marker — independent from auto-payments
  if (shouldAddBillsPeriodStart()) {
    log("period-start", "Scheduler triggered: adding bills period-start");
    try {
      const billsResult = runBillsPeriodStart();
      if (billsResult.added) {
        log("period-start", "Added Bills period-start.");
      } else {
        log("period-start", "Period-start marker already exists, skipping.");
      }
    } catch (err) {
      log("error", `Failed to run bills period-start: ${err}`);
    }
  } else {
    log("period-start", "Not the configured day for bills, skipping");
  }

  // Automatic payments — independent from period marker
  if (shouldAddAutomaticPayments()) {
    log("period-start", "Scheduler triggered: adding automatic payments");
    try {
      const createdCount = createAutomaticPaymentTransactions();
      log("period-start", `Created ${createdCount} automatic payment transactions for Bills.`);
    } catch (err) {
      log("error", `Failed to create automatic payment transactions: ${err}`);
    }
  } else {
    log("period-start", "Automatic payments already exist for this period, skipping.");
  }

  if (shouldAddBalancePeriodStart()) {
    log("period-start", "Scheduler triggered: adding balance period-start");
    try {
      const balanceResult = runBalancePeriodStart();
      if (balanceResult.added) {
        log("period-start", `Added Balance period-start.`);
      }
    } catch (err) {
      log("error", `Failed to run balance period-start: ${err}`);
    }
  } else {
    log("period-start", "Not the configured day for balance, skipping");
  }
}

export function startScheduler(): void {
  if (started) {
    log("init", "Scheduler already started, skipping");
    return;
  }
  started = true;

  log("init", "Scheduler starting");

  cron.schedule("0 4 * * *", () => {
    runCleanup();
    runAllowanceCheck();
    runPeriodStartChecks();
  });

  log("init", "Scheduled daily cleanup + allowance check at 04:00 UTC");
}
