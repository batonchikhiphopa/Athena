import fs from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";
import { DATABASE_PATH } from "../config/env.js";

export type AthenaDb = Database;
export type DbWriteTransaction<T> = (db: AthenaDb) => Promise<T>;

let db: AthenaDb | undefined;
let writeLock: Promise<void> = Promise.resolve();

export async function getDb(): Promise<AthenaDb> {
  if (!db) {
    await fs.mkdir(path.dirname(DATABASE_PATH), { recursive: true });

    db = await open({
      filename: DATABASE_PATH,
      driver: sqlite3.Database,
    });

    await db.exec("PRAGMA foreign_keys = ON;");
  }

  return db;
}

export async function withDbWriteTransaction<T>(
  db: AthenaDb,
  callback: DbWriteTransaction<T>,
): Promise<T> {
  const previousLock = writeLock;
  let releaseLock!: () => void;

  writeLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  await previousLock;
  await db.exec("BEGIN");

  try {
    const result = await callback(db);
    await db.exec("COMMIT");

    return result;
  } catch (error) {
    await db.exec("ROLLBACK").catch((rollbackError) => {
      console.error("[sqlite:rollback]", rollbackError);
    });

    throw error;
  } finally {
    releaseLock();
  }
}
