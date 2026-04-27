import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import {
  createEntry,
  deleteEntry,
  getEntryById,
  listEntries,
  updateEntry,
} from "../server/services/entry.service.js";

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

function validSignal(overrides = {}) {
  return {
    topics: ["работа"],
    activities: ["кодинг"],
    markers: ["deep_work"],
    load: 4,
    fatigue: null,
    focus: 7,
    signal_quality: "valid",
    ...overrides,
  };
}

test("entry create/read flow stores only textless metadata and signals", async () => {
  const db = await createTestDb();

  try {
    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-1",
      entry_date: "2026-04-24",
      tags: ["athena", "sprint2"],
      source_text_hash: "a".repeat(64),
      signal: validSignal(),
    });

    const entry = await getEntryById(db, entryId);
    assert.equal("text" in entry, false);
    assert.equal(entry.client_entry_id, "client-entry-1");
    assert.equal(entry.entry_date, "2026-04-24");
    assert.deepEqual(entry.tags, ["athena", "sprint2"]);
    assert.equal(entry.status, "extracted");
    assert.equal(entry.source_text_hash, "a".repeat(64));
    assert.deepEqual(entry.signal.topics, ["работа"]);
    assert.equal(entry.signal.load, 4);
    assert.equal(entry.metadata.schema_version, "signal.v1");
    assert.equal(entry.metadata.provider, "ollama");
    assert.equal(entry.metadata.error_code, null);
    assert.ok(entry.created_at);
    assert.ok(entry.updated_at);

    const entries = await listEntries(db);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].id, entryId);
    assert.equal("text" in entries[0], false);
  } finally {
    await db.close();
  }
});

test("entries table has no raw text column", async () => {
  const db = await createTestDb();

  try {
    const columns = await db.all("PRAGMA table_info(entries)");
    assert.equal(columns.some((column) => column.name === "text"), false);
  } finally {
    await db.close();
  }
});

test("entry update keeps the same server entry id", async () => {
  const db = await createTestDb();

  try {
    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-update",
      entry_date: "2026-04-24",
      tags: ["before"],
      source_text_hash: "e".repeat(64),
      signal: validSignal(),
    });

    const updated = await updateEntry(db, entryId, {
      entry_date: "2026-04-24",
      tags: ["after"],
      source_text_hash: "f".repeat(64),
      signal: validSignal({ topics: ["дизайн"], focus: 8 }),
      metadata: {
        schema_version: "signal.v1",
        prompt_version: "extraction.v1",
        provider: "gemini",
        model: "gemini-2.5-flash-lite",
      },
    });
    const entries = await listEntries(db);
    const signalCount = await db.get(
      "SELECT COUNT(*) AS count FROM signals WHERE entry_id = ?",
      [entryId],
    );

    assert.equal(updated.id, entryId);
    assert.equal(updated.client_entry_id, "client-entry-update");
    assert.equal(updated.source_text_hash, "f".repeat(64));
    assert.deepEqual(updated.tags, ["after"]);
    assert.deepEqual(updated.signal.topics, ["дизайн"]);
    assert.equal(updated.metadata.provider, "gemini");
    assert.equal(entries.length, 1);
    assert.equal(signalCount.count, 2);
  } finally {
    await db.close();
  }
});

test("entry delete removes metadata and signals", async () => {
  const db = await createTestDb();

  try {
    const entryId = await createEntry(db, {
      client_entry_id: "client-entry-delete",
      entry_date: "2026-04-24",
      tags: [],
      source_text_hash: "1".repeat(64),
      signal: validSignal(),
    });

    await db.run(
      "INSERT INTO signal_overrides (entry_id, focus, created_at) VALUES (?, ?, ?)",
      [entryId, 9, new Date().toISOString()],
    );

    assert.equal(await deleteEntry(db, entryId), true);
    assert.equal(await getEntryById(db, entryId), null);
    assert.deepEqual(await db.all("SELECT * FROM signals WHERE entry_id = ?", [entryId]), []);
    assert.deepEqual(
      await db.all("SELECT * FROM signal_overrides WHERE entry_id = ?", [entryId]),
      [],
    );
  } finally {
    await db.close();
  }
});
