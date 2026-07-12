import test from "node:test";
import assert from "node:assert/strict";

import {
  createEntrySyncIdempotencyKey,
  createEntrySyncQueuePayload,
  validateEntrySyncQueuePayload,
} from "../client/src/features/sync/entrySyncJob.ts";
import { QueueJobError } from "../client/src/features/sync/queueErrors.ts";

const RAW_TEXT = "this is private diary text that must not enter queue payload";

test("entry.sync payload contains only textless fields", () => {
  const payload = createEntrySyncQueuePayload({
    entryId: "entry-1",
    sourceTextHash: "a".repeat(64),
    localRevision: "2026-06-06T20:00:00.000Z",
    queuedAt: "2026-06-06T20:01:00.000Z",
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "entry_id",
    "local_revision",
    "queued_at",
    "source_text_hash",
  ]);

  assert.equal(payload.entry_id, "entry-1");
  assert.equal(payload.source_text_hash, "a".repeat(64));
  assert.equal(payload.local_revision, "2026-06-06T20:00:00.000Z");
  assert.equal(payload.queued_at, "2026-06-06T20:01:00.000Z");
});

test("entry.sync payload does not serialize raw diary text or raw-text-like keys", () => {
  const payload = createEntrySyncQueuePayload({
    entryId: "entry-1",
    sourceTextHash: "b".repeat(64),
    localRevision: "2026-06-06T20:00:00.000Z",
    queuedAt: "2026-06-06T20:01:00.000Z",
  });

  const serialized = JSON.stringify(payload);
  const forbiddenKeys = ["text", "raw_text", "content", "body"];

  assert.equal(serialized.includes(RAW_TEXT), false);

  for (const key of forbiddenKeys) {
    assert.equal(Object.hasOwn(payload, key), false);
    assert.equal(serialized.includes(`"${key}":`), false);
  }
});

test("entry.sync idempotency key is stable and revision-specific", () => {
  const firstPayload = createEntrySyncQueuePayload({
    entryId: "entry-1",
    sourceTextHash: "c".repeat(64),
    localRevision: "2026-06-06T20:00:00.000Z",
    queuedAt: "2026-06-06T20:01:00.000Z",
  });

  const secondPayload = createEntrySyncQueuePayload({
    entryId: "entry-1",
    sourceTextHash: "c".repeat(64),
    localRevision: "2026-06-06T20:00:00.000Z",
    queuedAt: "2026-06-06T20:02:00.000Z",
  });

  const changedRevisionPayload = createEntrySyncQueuePayload({
    entryId: "entry-1",
    sourceTextHash: "c".repeat(64),
    localRevision: "2026-06-06T20:05:00.000Z",
    queuedAt: "2026-06-06T20:06:00.000Z",
  });

  assert.equal(
    createEntrySyncIdempotencyKey(firstPayload),
    createEntrySyncIdempotencyKey(secondPayload),
  );

  assert.notEqual(
    createEntrySyncIdempotencyKey(firstPayload),
    createEntrySyncIdempotencyKey(changedRevisionPayload),
  );

  assert.equal(
    createEntrySyncIdempotencyKey(firstPayload),
    `entry.sync:entry:entry-1:${"c".repeat(
      64,
    )}:2026-06-06T20:00:00.000Z`,
  );
});

test("entry.sync payload validation rejects unsupported raw text fields", () => {
  assert.throws(
    () =>
      validateEntrySyncQueuePayload({
        entry_id: "entry-1",
        source_text_hash: "d".repeat(64),
        local_revision: "2026-06-06T20:00:00.000Z",
        queued_at: "2026-06-06T20:01:00.000Z",
        text: RAW_TEXT,
      }),
    (error) => {
      assert.equal(error instanceof QueueJobError, true);
      assert.equal(error.kind, "blocked");
      assert.equal(error.code, "malformed_payload");
      return true;
    },
  );
});

test("entry.sync payload validation rejects malformed source hash", () => {
  assert.throws(
    () =>
      validateEntrySyncQueuePayload({
        entry_id: "entry-1",
        source_text_hash: "not-a-hash",
        local_revision: "2026-06-06T20:00:00.000Z",
        queued_at: "2026-06-06T20:01:00.000Z",
      }),
    (error) => {
      assert.equal(error instanceof QueueJobError, true);
      assert.equal(error.kind, "blocked");
      assert.equal(error.code, "malformed_payload");
      return true;
    },
  );
});
