import fs from "node:fs/promises";
import path from "node:path";
import {
  DATABASE_PATH,
  PROJECT_ROOT,
} from "../config/env.js";
import { ensureCanonicalSchema } from "./canonical-schema.js";
import { getDb } from "./sqlite.js";

const databasePath = assertSafeDatabasePath(DATABASE_PATH);

await removeDatabaseFiles(databasePath);

const db = await getDb();

try {
  await ensureCanonicalSchema({
    db,
    schemaPath: path.join(PROJECT_ROOT, "schema.sql"),
  });
} finally {
  await db.close();
}

console.log(`Canonical backend database recreated at ${databasePath}`);

function assertSafeDatabasePath(value: string): string {
  const resolved = path.resolve(value);
  const parsed = path.parse(resolved);
  const allowedExtensions = new Set([".db", ".sqlite", ".sqlite3"]);

  if (resolved === parsed.root || !allowedExtensions.has(parsed.ext.toLowerCase())) {
    throw new Error(
      `Refusing to reset unsafe database path: ${resolved}. Expected a .db, .sqlite, or .sqlite3 file.`,
    );
  }

  return resolved;
}

async function removeDatabaseFiles(databasePath: string): Promise<void> {
  const targets = [databasePath, `${databasePath}-wal`, `${databasePath}-shm`];

  for (const target of targets) {
    const stat = await fs.stat(target).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return null;
      }

      throw error;
    });

    if (stat?.isDirectory()) {
      throw new Error(`Refusing to remove database directory: ${target}`);
    }

    if (stat) {
      await fs.rm(target);
    }
  }
}
