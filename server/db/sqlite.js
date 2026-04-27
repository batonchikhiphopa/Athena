import fs from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { DATABASE_PATH } from "../config/env.js";

let db;

export async function getDb() {
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
