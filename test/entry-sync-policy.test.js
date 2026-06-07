import test from "node:test";
import assert from "node:assert/strict";

import { planEntrySyncJob } from "../client/src/features/sync/entrySyncPolicy.ts";

function payload(overrides = {}) {
  return {
    entry_id: "entry-1",
    source_text_hash: "a".repeat(64),
    local_revision: "2026-06-06T20:00:00.000Z",
    queued_at: "2026-06-06T20:01:00.000Z",
    ...overrides,
  };
}

function localEntry(overrides = {}) {
  return {
    id: "entry-1",
    source_text_hash: "a".repeat(64),
    updatedAt: "2026-06-06T20:00:00.000Z",
    analysis_enabled: true,
    ...overrides,
  };
}

test("entry.sync policy allows current local entry to sync", () => {
  const plan = planEntrySyncJob(payload(), localEntry());

  assert.equal(plan.action, "sync");
});

test("entry.sync policy blocks missing local entry", () => {
  const plan = planEntrySyncJob(payload(), null);

  assert.equal(plan.action, "block");
  assert.equal(plan.code, "missing_local_entry");
});

test("entry.sync policy skips entries with analysis disabled", () => {
  const plan = planEntrySyncJob(
    payload(),
    localEntry({
      analysis_enabled: false,
    }),
  );

  assert.equal(plan.action, "skip");
  assert.equal(plan.reason, "analysis_disabled");
});

test("entry.sync policy conflicts on source hash mismatch", () => {
  const plan = planEntrySyncJob(
    payload({
      source_text_hash: "a".repeat(64),
    }),
    localEntry({
      source_text_hash: "b".repeat(64),
    }),
  );

  assert.equal(plan.action, "conflict");
  assert.equal(plan.code, "source_hash_mismatch");
});

test("entry.sync policy conflicts on stale local revision", () => {
  const plan = planEntrySyncJob(
    payload({
      local_revision: "2026-06-06T20:00:00.000Z",
    }),
    localEntry({
      updatedAt: "2026-06-06T20:05:00.000Z",
    }),
  );

  assert.equal(plan.action, "conflict");
  assert.equal(plan.code, "stale_local_revision");
});