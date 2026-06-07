import test from "node:test";
import assert from "node:assert/strict";

import { createEntrySchema } from "../server/core/entry.schema.ts";
import {
  createEntry,
  getEntryById,
} from "../server/services/entry.service.ts";
import { createTestDb } from "./helpers/createTestDb.js";
import { validSignal } from "./signal-fixtures.js";

const RAW_TEXT = "this private diary text must never reach backend entries";

function entryInput(overrides = {}) {
  return {
    client_entry_id: "entry-1",
    entry_date: "2026-06-06",
    tags: ["sync", "queue"],
    source_text_hash: "a".repeat(64),
    signal: validSignal(),
    metadata: {
      schema_version: "signal.v4",
      prompt_version: "extraction.v5",
      provider: "off",
      model: "fallback",
      error_code: null,
    },
    ...overrides,
  };
}

test("POST /entries payload schema rejects raw text fields", () => {
  const parsed = createEntrySchema.safeParse({
    ...entryInput(),
    text: RAW_TEXT,
  });

  assert.equal(parsed.success, false);
});

test("POST /entries payload schema rejects content and body fields", () => {
  const withContent = createEntrySchema.safeParse({
    ...entryInput(),
    content: RAW_TEXT,
  });

  const withBody = createEntrySchema.safeParse({
    ...entryInput(),
    body: RAW_TEXT,
  });

  assert.equal(withContent.success, false);
  assert.equal(withBody.success, false);
});

test("createEntry is idempotent for same client_entry_id and source_text_hash", async () => {
  const db = await createTestDb();

  const firstId = await createEntry(db, entryInput());
  const secondId = await createEntry(db, entryInput());

  assert.equal(secondId, firstId);

  const entry = await getEntryById(db, firstId ?? "");

  assert.ok(entry);
  assert.equal(entry.client_entry_id, "entry-1");
  assert.equal(entry.source_text_hash, "a".repeat(64));
});

test("createEntry keeps source hash mismatch as explicit conflict", async () => {
  const db = await createTestDb();

  await createEntry(db, entryInput());

  await assert.rejects(
    () =>
      createEntry(
        db,
        entryInput({
          source_text_hash: "b".repeat(64),
        }),
      ),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.equal(error.code, "SOURCE_HASH_MISMATCH");
      return true;
    },
  );
});

test("duplicate create does not append another signal row", async () => {
  const db = await createTestDb();

  const firstId = await createEntry(db, entryInput());
  const secondId = await createEntry(db, entryInput());

  assert.equal(secondId, firstId);

  const rows = await db.all(
    "SELECT id, entry_id, source_text_hash FROM signals WHERE entry_id = ?",
    [firstId],
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].source_text_hash, "a".repeat(64));
});
