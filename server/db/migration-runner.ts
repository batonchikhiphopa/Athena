import fs from "fs/promises";
import path from "path";
import type { AthenaDb } from "./sqlite.js";

const MIGRATION_FILENAME_PATTERN = /^(\d{3})_[a-z0-9_]+\.sql$/;

export type MigrationPlanItem = {
  id: string;
  filename: string;
  path: string;
  sequence: number;
};

export type MigrationLogger = Pick<Console, "log">;

type MigrationRow = {
  id: string;
};

export async function loadMigrationPlan(
  migrationsDir: string,
): Promise<MigrationPlanItem[]> {
  const filenames = (await fs.readdir(migrationsDir))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  const plan = filenames.map((filename) => {
    const match = MIGRATION_FILENAME_PATTERN.exec(filename);

    if (!match) {
      throw new Error(
        `Invalid migration filename "${filename}". Expected 001_name.sql.`,
      );
    }

    return {
      id: path.basename(filename, ".sql"),
      filename,
      path: path.join(migrationsDir, filename),
      sequence: Number(match[1]),
    };
  });

  validateMigrationPlan(plan);

  return plan;
}

export async function runMigrations({
  db,
  logger = console,
  migrationsDir,
}: {
  db: AthenaDb;
  logger?: MigrationLogger;
  migrationsDir: string;
}) {
  const plan = await loadMigrationPlan(migrationsDir);

  await db.exec("PRAGMA foreign_keys = ON;");
  await db.exec("PRAGMA busy_timeout = 5000;");
  await db.exec("BEGIN IMMEDIATE;");

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    for (const migration of plan) {
      const applied = await db.get<MigrationRow>(
        "SELECT id FROM schema_migrations WHERE id = ?",
        migration.id,
      );

      if (applied) {
        logger.log(`Migration ${migration.id} already applied`);
        continue;
      }

      const sql = await fs.readFile(migration.path, "utf8");

      await db.exec(sql);
      await db.run(
        `
          INSERT INTO schema_migrations (id, filename, applied_at)
          VALUES (?, ?, ?)
        `,
        [migration.id, migration.filename, new Date().toISOString()],
      );

      logger.log(`Migration ${migration.id} applied`);
    }

    await verifyAppliedMigrations(db, plan);
    await db.exec("COMMIT;");
  } catch (error) {
    await db.exec("ROLLBACK;").catch((rollbackError) => {
      console.error("[migrate:rollback]", rollbackError);
    });
    throw error;
  }

  await runMigrationIntegrityChecks(db);
}

export async function runMigrationIntegrityChecks(db: AthenaDb) {
  const quickCheck = await db.get<{ quick_check: string }>(
    "PRAGMA quick_check;",
  );

  if (quickCheck?.quick_check !== "ok") {
    throw new Error(`SQLite integrity check failed: ${quickCheck?.quick_check}`);
  }

  const foreignKeyErrors = await db.all("PRAGMA foreign_key_check;");

  if (foreignKeyErrors.length > 0) {
    throw new Error("SQLite foreign key check failed after migrations");
  }
}

function validateMigrationPlan(plan: MigrationPlanItem[]) {
  const seenIds = new Set<string>();
  const seenSequences = new Set<number>();

  for (let index = 0; index < plan.length; index += 1) {
    const migration = plan[index];
    const expectedSequence = index + 1;

    if (seenIds.has(migration.id)) {
      throw new Error(`Duplicate migration id "${migration.id}"`);
    }

    if (seenSequences.has(migration.sequence)) {
      throw new Error(
        `Duplicate migration sequence "${migration.sequence.toString().padStart(3, "0")}"`,
      );
    }

    if (migration.sequence !== expectedSequence) {
      throw new Error(
        `Migration sequence must be contiguous. Expected ${expectedSequence
          .toString()
          .padStart(3, "0")} but found ${migration.filename}.`,
      );
    }

    seenIds.add(migration.id);
    seenSequences.add(migration.sequence);
  }
}

async function verifyAppliedMigrations(
  db: AthenaDb,
  plan: MigrationPlanItem[],
) {
  for (const migration of plan) {
    const row = await db.get<MigrationRow>(
      "SELECT id FROM schema_migrations WHERE id = ?",
      migration.id,
    );

    if (!row) {
      throw new Error(`Migration ${migration.id} was not recorded as applied`);
    }
  }
}
