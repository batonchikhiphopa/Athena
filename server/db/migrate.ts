import path from "path";
import { PROJECT_ROOT } from "../config/env.js";
import { runMigrations } from "./migration-runner.js";
import { getDb } from "./sqlite.js";

const db = await getDb();
const migrationsDir = path.join(PROJECT_ROOT, "migrations");

await runMigrations({ db, migrationsDir });
