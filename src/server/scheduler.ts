import cron from "node-cron";
import { getDb } from "../db/connection.ts";
import { deleteCompletedParcels } from "../db/parcels.ts";

let started = false;

export function startScheduler(): void {
  if (started) return;
  started = true;

  cron.schedule("0 4 * * *", () => {
    try {
      const deleted = deleteCompletedParcels();
      console.log(`[scheduler] Cleaned up ${deleted} completed parcels`);
    } catch (err) {
      console.error("[scheduler] Failed to clean up completed parcels:", err);
    }
  });
}
