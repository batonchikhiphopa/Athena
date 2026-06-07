import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { runMigrations } from "../../server/db/migration-runner.js";

export async function createTestDb() {
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  await runMigrations({
    db,
    logger: { log() {} },
    migrationsDir: "./migrations",
  });

  return db;
}
