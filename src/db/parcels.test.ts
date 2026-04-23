import { test, expect } from "vitest";
import { createParcel, getParcels, completeParcel, deleteCompletedParcels } from "./parcels.ts";
import { openDb, resetDb } from "./connection.ts";

test("getParcels returns empty array on fresh DB", () => {
  resetDb();
  const db = openDb(":memory:");
  const parcels = getParcels("incoming", db);
  expect(parcels).toEqual([]);
  db.close();
  resetDb();
});

test("createParcel inserts record and returns numeric id", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes = new Uint8Array([1, 2, 3]);
  const id = createParcel("incoming", bytes, "image/png", db);
  expect(typeof id).toBe("number");
  expect(id > 0).toBe(true);
  db.close();
  resetDb();
});

test("getParcels filters by type", () => {
  resetDb();
  const db = openDb(":memory:");
  const incomingBytes = new Uint8Array([1, 2, 3]);
  const outgoingBytes = new Uint8Array([4, 5, 6]);
  createParcel("incoming", incomingBytes, "image/png", db);
  createParcel("outgoing", outgoingBytes, "image/jpeg", db);

  const incoming = getParcels("incoming", db);
  const outgoing = getParcels("outgoing", db);

  expect(incoming.length).toBe(1);
  expect(outgoing.length).toBe(1);
  expect(incoming[0].type).toBe("incoming");
  expect(outgoing[0].type).toBe("outgoing");
  db.close();
  resetDb();
});

test("getParcels returns image data and content_type", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes = new Uint8Array([1, 2, 3]);
  createParcel("incoming", bytes, "image/png", db);

  const parcels = getParcels("incoming", db);
  expect(parcels.length).toBe(1);
  expect(parcels[0].image).toEqual(bytes);
  expect(parcels[0].content_type).toBe("image/png");
  db.close();
  resetDb();
});

test("completeParcel sets completed_at and returns true", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes = new Uint8Array([1, 2, 3]);
  const id = createParcel("incoming", bytes, "image/png", db);

  const success = completeParcel(id, db);
  expect(success).toBe(true);

  const parcels = getParcels("incoming", db);
  expect(parcels.length).toBe(1);
  expect(parcels[0].completed_at).not.toBeNull();
  expect(typeof parcels[0].completed_at).toBe("number");
  db.close();
  resetDb();
});

test("completeParcel returns false for unknown id", () => {
  resetDb();
  const db = openDb(":memory:");
  const success = completeParcel(999, db);
  expect(success).toBe(false);
  db.close();
  resetDb();
});

test("completeParcel returns false for already completed parcel", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes = new Uint8Array([1, 2, 3]);
  const id = createParcel("incoming", bytes, "image/png", db);
  completeParcel(id, db);

  const success = completeParcel(id, db);
  expect(success).toBe(false);
  db.close();
  resetDb();
});

test("deleteCompletedParcels removes only completed parcels", () => {
  resetDb();
  const db = openDb(":memory:");
  const bytes1 = new Uint8Array([1, 2, 3]);
  const bytes2 = new Uint8Array([4, 5, 6]);
  const id1 = createParcel("incoming", bytes1, "image/png", db);
  createParcel("incoming", bytes2, "image/png", db);
  completeParcel(id1, db);

  const deleted = deleteCompletedParcels(db);
  expect(deleted).toBe(1);

  const parcels = getParcels("incoming", db);
  expect(parcels.length).toBe(1);
  expect(parcels[0].completed_at).toBeNull();
  db.close();
  resetDb();
});
