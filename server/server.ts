import path from "node:path";
import { createApp } from "./app.js";
import { HOST, PORT, PROJECT_ROOT } from "./config/env.js";
import { ensureCanonicalSchema } from "./db/canonical-schema.js";
import { getDb } from "./db/sqlite.js";

const db = await getDb();

await ensureCanonicalSchema({
  db,
  schemaPath: path.join(PROJECT_ROOT, "schema.sql"),
});

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
