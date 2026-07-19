import path from "node:path";
import { PROJECT_ROOT } from "../config/env.js";
import {
  ensureCanonicalSchema,
  runDatabaseIntegrityChecks,
} from "./canonical-schema.js";
import { getDb } from "./sqlite.js";

const db = await getDb();
const schemaPath = path.join(PROJECT_ROOT, "schema.sql");

try {
  await ensureCanonicalSchema({ db, schemaPath });
  await runDatabaseIntegrityChecks(db);
  console.log("Database integrity check passed");
} finally {
  await db.close();
}
