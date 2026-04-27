import cron from "node-cron";
import { deleteCompletedParcels } from "../db/parcels.ts";

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

export function startScheduler(): void {
  if (started) {
    log("init", "Scheduler already started, skipping");
    return;
  }
  started = true;

  log("init", "Scheduler starting");

  // Run once immediately so we know it works after deploy/restart
  runCleanup();

  cron.schedule("0 4 * * *", () => {
    runCleanup();
  });

  log("init", "Scheduled daily cleanup at 04:00 UTC");

  // Heartbeat: log every minute to verify scheduler is running
  cron.schedule("* * * * *", () => {
    log("heartbeat", "Scheduler alive - tick every minute");
  });

  log("init", "Scheduled heartbeat every minute");
}
