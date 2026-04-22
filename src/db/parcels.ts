import Database from "better-sqlite3";
import { getDb } from "./connection.ts";

export interface ParcelRow {
  id: number;
  type: "incoming" | "outgoing";
  image: Uint8Array;
  content_type: string;
  created_at: number;
}

export function getParcels(
  type: "incoming" | "outgoing",
  db?: Database.Database,
): ParcelRow[] {
  const dbConn = db ?? getDb();
  const rows = dbConn.prepare(
    "SELECT id, type, image, content_type, created_at FROM parcels WHERE type = ? ORDER BY created_at DESC",
  ).raw(true).all(type) as unknown[][];
  return rows.map((row) => ({
    id: row[0] as number,
    type: row[1] as "incoming" | "outgoing",
    image: new Uint8Array(row[2] as Buffer),
    content_type: row[3] as string,
    created_at: row[4] as number,
  }));
}

export function createParcel(
  type: "incoming" | "outgoing",
  image: Uint8Array,
  contentType: string,
  db?: Database.Database,
): number {
  const dbConn = db ?? getDb();
  const result = dbConn.prepare(
    "INSERT INTO parcels (type, image, content_type, created_at) VALUES (?, ?, ?, ?)",
  ).run(type, image, contentType, Date.now());
  return Number(result.lastInsertRowid);
}
