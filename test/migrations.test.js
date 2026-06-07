import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  loadMigrationPlan,
  runMigrations,
} from "../server/db/migration-runner.js";

test("migration runner applies valid migrations and records them", async () => {
  const migrationsDir = await createTempMigrations({
    "001_create_widget.sql": `
      CREATE TABLE widgets (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
    `,
    "002_insert_widget.sql": `
      INSERT INTO widgets (name) VALUES ('alpha');
    `,
  });
  const db = await createTempDb();

  try {
    await runMigrations({
      db,
      logger: { log() {} },
      migrationsDir,
    });

    const widget = await db.get("SELECT name FROM widgets WHERE id = 1");
    assert.equal(widget.name, "alpha");

    const rows = await db.all(
      "SELECT id, filename FROM schema_migrations ORDER BY id",
    );
    assert.deepEqual(rows, [
      {
        id: "001_create_widget",
        filename: "001_create_widget.sql",
      },
      {
        id: "002_insert_widget",
        filename: "002_insert_widget.sql",
      },
    ]);

    await runMigrations({
      db,
      logger: { log() {} },
      migrationsDir,
    });
    const count = await db.get("SELECT COUNT(*) AS count FROM widgets");
    assert.equal(count.count, 1);
  } finally {
    await db.close();
    await fs.rm(migrationsDir, { recursive: true, force: true });
  }
});

test("migration plan rejects invalid filenames", async () => {
  const migrationsDir = await createTempMigrations({
    "1_create_widget.sql": "SELECT 1;",
  });

  try {
    await assert.rejects(
      () => loadMigrationPlan(migrationsDir),
      /Invalid migration filename/,
    );
  } finally {
    await fs.rm(migrationsDir, { recursive: true, force: true });
  }
});

test("migration plan rejects non-contiguous numeric sequences", async () => {
  const migrationsDir = await createTempMigrations({
    "001_create_widget.sql": "SELECT 1;",
    "003_skip_widget.sql": "SELECT 1;",
  });

  try {
    await assert.rejects(
      () => loadMigrationPlan(migrationsDir),
      /Migration sequence must be contiguous/,
    );
  } finally {
    await fs.rm(migrationsDir, { recursive: true, force: true });
  }
});

test("migration runner rolls back failed migration batches", async () => {
  const migrationsDir = await createTempMigrations({
    "001_create_widget.sql": `
      CREATE TABLE widgets (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      );
    `,
    "002_bad_insert.sql": `
      INSERT INTO missing_table (name) VALUES ('nope');
    `,
  });
  const db = await createTempDb();

  try {
    await assert.rejects(
      () =>
        runMigrations({
          db,
          logger: { log() {} },
          migrationsDir,
        }),
      /SQLITE_ERROR/,
    );

    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'widgets'",
    );
    assert.equal(tables.length, 0);
  } finally {
    await db.close();
    await fs.rm(migrationsDir, { recursive: true, force: true });
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

async function createTempMigrations(files) {
  const migrationsDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "athena-migrations-"),
  );

  await Promise.all(
    Object.entries(files).map(([filename, sql]) =>
      fs.writeFile(path.join(migrationsDir, filename), sql, "utf8"),
    ),
  );

  return migrationsDir;
}
