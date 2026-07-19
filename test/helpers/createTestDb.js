import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { ensureCanonicalSchema } from "../../server/db/canonical-schema.js";

export async function createTestDb() {
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await ensureCanonicalSchema({
    db,
    logger: { log() {} },
    schemaPath: "./schema.sql",
  });

  return db;
}
