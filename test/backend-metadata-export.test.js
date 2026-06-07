import test from "node:test";
import assert from "node:assert/strict";

import { ACTIVE_PROMPT_VERSION, ACTIVE_SCHEMA_VERSION } from "../server/config/versions.js";
import { buildBackendMetadataExport } from "../server/services/export.service.js";
import { createEntry } from "../server/services/entry.service.js";
import { createTestDb } from "./helpers/createTestDb.js";
import { validSignal } from "./signal-fixtures.js";

test("backend metadata export is versioned and textless", async () => {
  const db = await createTestDb();

  try {
    await createEntry(db, {
      client_entry_id: "export-entry-1",
      entry_date: "2026-06-07",
      tags: ["export"],
      source_text_hash: "a".repeat(64),
      signal: validSignal(),
    });

    const exported = await buildBackendMetadataExport(db);
    const serialized = JSON.stringify(exported);

    assert.equal(exported.app, "athena");
    assert.equal(exported.export_version, "backend_metadata_export.v1");
    assert.equal(exported.source.schema_version, ACTIVE_SCHEMA_VERSION);
    assert.equal(exported.source.prompt_version, ACTIVE_PROMPT_VERSION);
    assert.equal(exported.entries.length, 1);
    assert.equal(exported.signals.length, 1);
    assert.equal("text" in exported.entries[0], false);
    assert.equal(serialized.includes("private diary"), false);
    assert.equal(serialized.includes("password_hash"), false);
    assert.equal(serialized.includes("token_hash"), false);
    assert.equal(serialized.includes("csrf"), false);
  } finally {
    await db.close();
  }
});
