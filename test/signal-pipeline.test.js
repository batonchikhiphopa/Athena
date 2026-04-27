import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import {
  ACTIVE_MODEL,
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../server/config/versions.js";
import {
  appendEntrySignal,
  createEntry,
  getEntryById,
} from "../server/services/entry.service.js";
import {
  createFallbackSignal,
  sanitizeSignalCandidate,
} from "../server/services/sanitization.service.js";

async function createTestDb() {
  const db = await open({
    filename: ":memory:",
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");
  const files = (await fs.readdir("./migrations"))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    await db.exec(await fs.readFile(`./migrations/${filename}`, "utf8"));
  }

  return db;
}

test("invalid extraction output persists deterministic fallback without raw text", async () => {
  const db = await createTestDb();

  try {
    const invalidCandidate = {
      topics: [""],
      activities: [],
      markers: [],
      load: null,
      fatigue: null,
      focus: null,
      signal_quality: "sparse",
    };

    const sanitized = sanitizeSignalCandidate(invalidCandidate);
    assert.equal(sanitized.ok, false);

    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-fallback",
      entry_date: "2026-04-24",
      tags: [],
      source_text_hash: "b".repeat(64),
      signal: invalidCandidate,
    });

    const finalizedEntry = await getEntryById(db, entryId);
    const storedSignal = await db.get(
      "SELECT * FROM signals WHERE entry_id = ?",
      [entryId]
    );

    assert.equal("text" in finalizedEntry, false);
    assert.equal(finalizedEntry.status, "fallback");
    assert.equal(storedSignal.source_text_hash, "b".repeat(64));
    assert.equal(storedSignal.signal_quality, "fallback");
    assert.equal(storedSignal.topics, "[]");
    assert.equal(storedSignal.activities, "[]");
    assert.equal(storedSignal.markers, "[]");
    assert.equal(storedSignal.load, null);
    assert.equal(storedSignal.fatigue, null);
    assert.equal(storedSignal.focus, null);
    assert.equal(storedSignal.schema_version, ACTIVE_SCHEMA_VERSION);
    assert.equal(storedSignal.prompt_version, ACTIVE_PROMPT_VERSION);
    assert.equal(storedSignal.provider, "ollama");
    assert.equal(storedSignal.model, ACTIVE_MODEL);
    assert.equal(storedSignal.error_code, null);
  } finally {
    await db.close();
  }
});

test("client fallback payload shape remains valid", () => {
  assert.deepEqual(createFallbackSignal(), {
    topics: [],
    activities: [],
    markers: [],
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "fallback",
  });
});

test("fallback entry can receive a later signal for the same text hash", async () => {
  const db = await createTestDb();

  try {
    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-retry",
      entry_date: "2026-04-24",
      tags: [],
      source_text_hash: "d".repeat(64),
      signal: createFallbackSignal(),
    });

    const updated = await appendEntrySignal(db, entryId, {
      source_text_hash: "d".repeat(64),
      signal: {
        topics: ["работа"],
        activities: ["кодинг"],
        markers: ["deep_work"],
        load: 4,
        fatigue: null,
        focus: 7,
        signal_quality: "valid",
      },
      metadata: {
        schema_version: ACTIVE_SCHEMA_VERSION,
        prompt_version: ACTIVE_PROMPT_VERSION,
        provider: "gemini",
        model: "gemini-2.5-flash-lite",
      },
    });
    const signalCount = await db.get(
      "SELECT COUNT(*) AS count FROM signals WHERE entry_id = ?",
      [entryId],
    );

    assert.equal(updated.status, "extracted");
    assert.equal(updated.signal.signal_quality, "valid");
    assert.equal(updated.metadata.provider, "gemini");
    assert.equal(updated.metadata.error_code, null);
    assert.equal(signalCount.count, 2);
  } finally {
    await db.close();
  }
});
