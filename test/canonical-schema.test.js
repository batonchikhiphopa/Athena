import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  ensureCanonicalSchema,
  loadCanonicalSchema,
} from "../server/db/canonical-schema.js";

const canonicalSchemaPath = path.resolve("schema.sql");

test("canonical schema initializes a fresh database exactly once", async () => {
  const db = await createTempDb();

  try {
    const expected = await loadCanonicalSchema(canonicalSchemaPath);
    const first = await ensureCanonicalSchema({
      db,
      logger: { log() {} },
      schemaPath: canonicalSchemaPath,
    });
    const second = await ensureCanonicalSchema({
      db,
      logger: { log() {} },
      schemaPath: canonicalSchemaPath,
    });
    const marker = await db.get(
      "SELECT id, fingerprint FROM athena_schema WHERE id = 1",
    );
    const signalColumns = await db.all("PRAGMA table_info(signals)");
    const authTables = await db.all(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('auth_users', 'auth_sessions')
    `);

    assert.deepEqual(first, {
      fingerprint: expected.fingerprint,
      initialized: true,
    });
    assert.deepEqual(second, {
      fingerprint: expected.fingerprint,
      initialized: false,
    });
    assert.deepEqual(marker, {
      id: 1,
      fingerprint: expected.fingerprint,
    });
    assert.ok(signalColumns.some((column) => column.name === "activity_contexts"));
    assert.ok(!signalColumns.some((column) => column.name === "emotion_signals"));
    assert.deepEqual(authTables, []);
  } finally {
    await db.close();
  }
});

test("canonical schema removes tables from the retired server auth schema", async () => {
  const db = await createTempDb();

  try {
    const expected = await loadCanonicalSchema(canonicalSchemaPath);
    await ensureCanonicalSchema({
      db,
      logger: { log() {} },
      schemaPath: canonicalSchemaPath,
    });
    await db.exec(`
      CREATE TABLE auth_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL CHECK (role IN ('owner')),
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE auth_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        csrf_token_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        revoked_at TEXT,
        FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
      );
      UPDATE athena_schema
      SET fingerprint = '4007a3e37a821b8a811bfbc020d2cd40a6ada942099a870bcb58af07a057a045'
      WHERE id = 1;
    `);

    const result = await ensureCanonicalSchema({
      db,
      logger: { log() {} },
      schemaPath: canonicalSchemaPath,
    });
    const tables = await db.all(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name IN ('auth_users', 'auth_sessions')
    `);
    const marker = await db.get(
      "SELECT fingerprint FROM athena_schema WHERE id = 1",
    );

    assert.deepEqual(result, {
      fingerprint: expected.fingerprint,
      initialized: false,
    });
    assert.deepEqual(tables, []);
    assert.equal(marker.fingerprint, expected.fingerprint);
  } finally {
    await db.close();
  }
});

test("canonical schema rejects an unmarked legacy database", async () => {
  const db = await createTempDb();

  try {
    await db.exec("CREATE TABLE legacy_table (id INTEGER PRIMARY KEY);");

    await assert.rejects(
      () =>
        ensureCanonicalSchema({
          db,
          logger: { log() {} },
          schemaPath: canonicalSchemaPath,
        }),
      /only supports the current canonical schema/,
    );
  } finally {
    await db.close();
  }
});

test("canonical schema rejects a different schema fingerprint", async () => {
  const db = await createTempDb();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "athena-schema-"));
  const changedSchemaPath = path.join(tempDir, "schema.sql");

  try {
    await ensureCanonicalSchema({
      db,
      logger: { log() {} },
      schemaPath: canonicalSchemaPath,
    });
    const canonicalSql = await fs.readFile(canonicalSchemaPath, "utf8");
    await fs.writeFile(changedSchemaPath, `${canonicalSql}\n-- changed\n`, "utf8");

    await assert.rejects(
      () =>
        ensureCanonicalSchema({
          db,
          logger: { log() {} },
          schemaPath: changedSchemaPath,
        }),
      /schema is not canonical/,
    );
  } finally {
    await db.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("canonical schema initialization rolls back invalid SQL", async () => {
  const db = await createTempDb();
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "athena-schema-"));
  const invalidSchemaPath = path.join(tempDir, "schema.sql");

  try {
    await fs.writeFile(
      invalidSchemaPath,
      `
        CREATE TABLE athena_schema (
          id INTEGER PRIMARY KEY,
          fingerprint TEXT NOT NULL,
          initialized_at TEXT NOT NULL
        );
        CREATE TABLE partial_table (id INTEGER PRIMARY KEY);
        INSERT INTO missing_table (id) VALUES (1);
      `,
      "utf8",
    );

    await assert.rejects(
      () =>
        ensureCanonicalSchema({
          db,
          logger: { log() {} },
          schemaPath: invalidSchemaPath,
        }),
      /SQLITE_ERROR/,
    );

    const partialTable = await db.get(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'partial_table'",
    );
    assert.equal(partialTable, undefined);
  } finally {
    await db.close();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

async function createTempDb() {
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");
  return db;
}
