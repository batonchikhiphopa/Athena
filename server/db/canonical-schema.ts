import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import type { AthenaDb } from "./sqlite.js";

const SCHEMA_TABLE = "athena_schema";
const RETIRED_SERVER_AUTH_SCHEMA_FINGERPRINT =
  "4007a3e37a821b8a811bfbc020d2cd40a6ada942099a870bcb58af07a057a045";
const SERVER_AUTH_FREE_SCHEMA_FINGERPRINT =
  "8ee037c8537295536ceb3663a2bfd5d675aeea836f2dd5b32aa0dc9e0ebe766a";

type SchemaLogger = Pick<Console, "log">;

type SchemaMarker = {
  fingerprint: string;
};

export type CanonicalSchema = {
  fingerprint: string;
  sql: string;
};

export async function loadCanonicalSchema(
  schemaPath: string,
): Promise<CanonicalSchema> {
  const source = await fs.readFile(schemaPath, "utf8");
  const sql = normalizeSchemaSql(source);

  return {
    fingerprint: createHash("sha256").update(sql).digest("hex"),
    sql,
  };
}

export async function ensureCanonicalSchema({
  db,
  logger = console,
  schemaPath,
}: {
  db: AthenaDb;
  logger?: SchemaLogger;
  schemaPath: string;
}): Promise<{ fingerprint: string; initialized: boolean }> {
  const schema = await loadCanonicalSchema(schemaPath);
  const existingMarker = await readSchemaMarker(db);

  if (existingMarker) {
    if (
      await removeRetiredServerAuthTables({
        db,
        existingMarker,
        logger,
        targetFingerprint: schema.fingerprint,
      })
    ) {
      return { fingerprint: schema.fingerprint, initialized: false };
    }

    assertCurrentSchema(existingMarker, schema.fingerprint);
    logger.log(`Database schema current (${shortFingerprint(schema.fingerprint)})`);
    return { fingerprint: schema.fingerprint, initialized: false };
  }

  await db.exec("PRAGMA busy_timeout = 5000;");
  await db.exec("BEGIN IMMEDIATE;");

  try {
    const markerAfterLock = await readSchemaMarker(db);

    if (markerAfterLock) {
      assertCurrentSchema(markerAfterLock, schema.fingerprint);
      await db.exec("COMMIT;");
      logger.log(`Database schema current (${shortFingerprint(schema.fingerprint)})`);
      return { fingerprint: schema.fingerprint, initialized: false };
    }

    const existingTable = await db.get<{ name: string }>(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      LIMIT 1
    `);

    if (existingTable) {
      throw new Error(
        "Unsupported backend database schema. Athena only supports the current canonical schema. Run `npm run db:reset` to recreate the development database.",
      );
    }

    await db.exec(schema.sql);
    await db.run(
      `
        INSERT INTO ${SCHEMA_TABLE} (id, fingerprint, initialized_at)
        VALUES (1, ?, ?)
      `,
      [schema.fingerprint, new Date().toISOString()],
    );
    await runDatabaseIntegrityChecks(db);
    await db.exec("COMMIT;");

    logger.log(`Database schema initialized (${shortFingerprint(schema.fingerprint)})`);
    return { fingerprint: schema.fingerprint, initialized: true };
  } catch (error) {
    await db.exec("ROLLBACK;").catch((rollbackError) => {
      console.error("[db:schema:rollback]", rollbackError);
    });
    throw error;
  }
}

async function removeRetiredServerAuthTables({
  db,
  existingMarker,
  logger,
  targetFingerprint,
}: {
  db: AthenaDb;
  existingMarker: SchemaMarker;
  logger: SchemaLogger;
  targetFingerprint: string;
}): Promise<boolean> {
  if (
    existingMarker.fingerprint !== RETIRED_SERVER_AUTH_SCHEMA_FINGERPRINT ||
    targetFingerprint !== SERVER_AUTH_FREE_SCHEMA_FINGERPRINT
  ) {
    return false;
  }

  await db.exec("PRAGMA busy_timeout = 5000;");
  await db.exec("BEGIN IMMEDIATE;");

  try {
    const markerAfterLock = await readSchemaMarker(db);

    if (markerAfterLock?.fingerprint === targetFingerprint) {
      await db.exec("COMMIT;");
      return true;
    }

    if (
      markerAfterLock?.fingerprint !== RETIRED_SERVER_AUTH_SCHEMA_FINGERPRINT
    ) {
      throw new Error("Backend schema changed while removing retired auth tables");
    }

    await db.exec(`
      DROP TABLE auth_sessions;
      DROP TABLE auth_users;
    `);
    await db.run(
      `UPDATE ${SCHEMA_TABLE} SET fingerprint = ? WHERE id = 1`,
      targetFingerprint,
    );
    await runDatabaseIntegrityChecks(db);
    await db.exec("COMMIT;");
    logger.log("Removed retired server auth tables");
    return true;
  } catch (error) {
    await db.exec("ROLLBACK;").catch((rollbackError) => {
      console.error("[db:auth-removal:rollback]", rollbackError);
    });
    throw error;
  }
}

export async function readCanonicalSchemaFingerprint(
  db: AthenaDb,
): Promise<string | null> {
  return (await readSchemaMarker(db))?.fingerprint ?? null;
}

export async function runDatabaseIntegrityChecks(db: AthenaDb): Promise<void> {
  const quickCheck = await db.get<{ quick_check: string }>(
    "PRAGMA quick_check;",
  );

  if (quickCheck?.quick_check !== "ok") {
    throw new Error(`SQLite integrity check failed: ${quickCheck?.quick_check}`);
  }

  const foreignKeyErrors = await db.all("PRAGMA foreign_key_check;");

  if (foreignKeyErrors.length > 0) {
    throw new Error("SQLite foreign key check failed");
  }
}

async function readSchemaMarker(db: AthenaDb): Promise<SchemaMarker | null> {
  const table = await db.get<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    SCHEMA_TABLE,
  );

  if (!table) {
    return null;
  }

  const marker = await db.get<SchemaMarker>(
    `SELECT fingerprint FROM ${SCHEMA_TABLE} WHERE id = 1`,
  );

  if (!marker) {
    throw new Error(
      "Canonical schema marker is missing. Run `npm run db:reset` to recreate the development database.",
    );
  }

  return marker;
}

function assertCurrentSchema(marker: SchemaMarker, expected: string): void {
  if (marker.fingerprint !== expected) {
    throw new Error(
      `Backend database schema is not canonical (found ${shortFingerprint(marker.fingerprint)}, expected ${shortFingerprint(expected)}). Run \`npm run db:reset\` to recreate it.`,
    );
  }
}

function normalizeSchemaSql(source: string): string {
  return `${source.replaceAll("\r\n", "\n").trim()}\n`;
}

function shortFingerprint(fingerprint: string): string {
  return fingerprint.slice(0, 12);
}
