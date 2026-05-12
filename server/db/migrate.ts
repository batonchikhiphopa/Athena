import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./sqlite.js";

type MigrationRow = {
  id: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = await getDb();

await db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );
`);

const migrationsDir = path.resolve(__dirname, "..", "..", "migrations");
const migrationFiles = (await fs.readdir(migrationsDir))
  .filter((filename) => filename.endsWith(".sql"))
  .sort();

for (const filename of migrationFiles) {
  const id = path.basename(filename, ".sql");
  const applied = await db.get<MigrationRow>(
    "SELECT id FROM schema_migrations WHERE id = ?",
    id,
  );

  if (applied) {
    console.log(`Migration ${id} already applied`);
    continue;
  }

  const migrationPath = path.join(migrationsDir, filename);
  const sql = await fs.readFile(migrationPath, "utf8");

  try {
    await db.exec("BEGIN");
    await db.exec(sql);
    await db.run(
      `
        INSERT INTO schema_migrations (id, filename, applied_at)
        VALUES (?, ?, ?)
      `,
      [id, filename, new Date().toISOString()],
    );
    await db.exec("COMMIT");

    console.log(`Migration ${id} applied`);
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}
