import Database from "better-sqlite3";

export function clearParcels() {
  const db = new Database("./data/app.db");
  db.prepare("DELETE FROM parcels").run();
  db.close();
}
