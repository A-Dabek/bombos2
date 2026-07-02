import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { runMigrations } from "./migrations.ts";
import {
  getMoneyFlows,
  addMoneyFlow,
  updateMoneyFlow,
  deleteMoneyFlow,
  getMoneyFlow,
} from "./flows.ts";

describe("flows db", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    runMigrations(db);
  });

  it("should add and get money flows", () => {
    addMoneyFlow("Wife transfers money", 5000, 15, db);
    addMoneyFlow("Husband pays credit card", -2000, 25, db);

    const flows = getMoneyFlows(db);
    expect(flows).toHaveLength(2);
    expect(flows[0].description).toBe("Wife transfers money");
    expect(flows[0].day_of_month).toBe(15);
    expect(flows[0].amount).toBe(5000);
    expect(flows[1].description).toBe("Husband pays credit card");
    expect(flows[1].day_of_month).toBe(25);
    expect(flows[1].amount).toBe(-2000);
  });

  it("should sort money flows starting from day 15", () => {
    addMoneyFlow("Day 25 item", 100, 25, db);
    addMoneyFlow("Day 5 item", 200, 5, db);
    addMoneyFlow("Day 15 item", 300, 15, db);
    addMoneyFlow("Day 14 item", 400, 14, db);

    const flows = getMoneyFlows(db);
    expect(flows[0].description).toBe("Day 15 item");
    expect(flows[1].description).toBe("Day 25 item");
    expect(flows[2].description).toBe("Day 5 item");
    expect(flows[3].description).toBe("Day 14 item");
  });

  it("should update money flow", () => {
    const id = addMoneyFlow("Original", 100, 10, db);
    const success = updateMoneyFlow(id, "Updated", 200, 20, db);
    expect(success).toBe(true);

    const updated = getMoneyFlow(id, db);
    expect(updated?.description).toBe("Updated");
    expect(updated?.amount).toBe(200);
    expect(updated?.day_of_month).toBe(20);
  });

  it("should delete money flow", () => {
    const id = addMoneyFlow("To delete", 100, 10, db);
    const success = deleteMoneyFlow(id, db);
    expect(success).toBe(true);

    const flows = getMoneyFlows(db);
    expect(flows).toHaveLength(0);
  });
});
