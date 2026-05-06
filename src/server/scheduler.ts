import cron from "node-cron";
import { deleteCompletedParcels } from "../db/parcels.ts";
import { checkAndAddAllowance } from "../db/allowance.ts";
import { checkAndAddBillsPeriodStart, createAutomaticPaymentTransactions } from "../db/bills.ts";
import { checkAndAddBalancePeriodStart } from "../db/balance.ts";

let started = false;

function log(label: string, message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[scheduler] [${timestamp}] [${label}] ${message}`);
}

function runCleanup(): void {
  log("cleanup", "Starting cleanup of completed parcels");
  try {
    const deleted = deleteCompletedParcels();
    log("cleanup", `Deleted ${deleted} completed parcels`);
  } catch (err) {
    log("error", `Failed to clean up completed parcels: ${err}`);
  }
}

function runAllowanceCheck(): void {
  log("allowance", "Checking if allowance should be added");
  try {
    const result = checkAndAddAllowance();
    if (result.added) {
      log("allowance", `Added allowance. New balance: ${result.newBalance}`);
    } else {
      log("allowance", "No allowance to add today");
    }
  } catch (err) {
    log("error", `Failed to check/add allowance: ${err}`);
  }
}

function runPeriodStartChecks(): void {
  log("period-start", "Checking if period-start transactions should be added");

  try {
    const billsResult = checkAndAddBillsPeriodStart();
    if (billsResult.added) {
      log("period-start", `Added Bills period-start.`);
      
      // After adding period marker, create automatic payment transactions
      try {
        const createdCount = createAutomaticPaymentTransactions();
        log("period-start", `Created ${createdCount} automatic payment transactions for Bills.`);
      } catch (err) {
        log("error", `Failed to create automatic payment transactions: ${err}`);
      }
    }
  } catch (err) {
    log("error", `Failed to check/add Bills period-start: ${err}`);
  }

  try {
    const balanceResult = checkAndAddBalancePeriodStart();
    if (balanceResult.added) {
      log("period-start", `Added Balance period-start.`);
    }
  } catch (err) {
    log("error", `Failed to check/add Balance period-start: ${err}`);
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
