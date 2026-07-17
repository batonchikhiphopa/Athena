import test from "node:test";
import assert from "node:assert/strict";

import {
  createEntryReprocessPayload,
  getSignalReprocessReason,
  isRetryableProviderErrorCode,
  isSignalReprocessCandidate,
  planEntryReprocessJob,
} from "../client/src/features/sync/reprocessPolicy.ts";
import {
  CLIENT_ACTIVE_PROMPT_VERSION,
  CLIENT_ACTIVE_SCHEMA_VERSION,
} from "../client/src/features/extraction/signalVersions.ts";
import { fallbackSignal, sparseSignal, validSignal } from "./signal-fixtures.js";

function metadata(overrides = {}) {
  return {
    schema_version: CLIENT_ACTIVE_SCHEMA_VERSION,
    prompt_version: CLIENT_ACTIVE_PROMPT_VERSION,
    provider: "off",
    model: "fallback",
    error_code: null,
    ...overrides,
  };
}

function localEntry(overrides = {}) {
  return {
    id: "entry-1",
    serverId: 1,
    text: "latest local source",
    entry_date: "2026-05-30",
    tags: [],
    analysis_enabled: true,
    source_text_hash: "b".repeat(64),
    signals: validSignal(),
    metadata: metadata(),
    sync_status: "pending_reextract",
    createdAt: "2026-05-30T10:00:00.000Z",
    updatedAt: "2026-05-30T10:00:00.000Z",
    ...overrides,
  };
}

function queueJob(payload = {}, overrides = {}) {
  return {
    id: "job-1",
    type: "entry.reprocess_signal",
    version: 1,
    payload,
    status: "queued",
    priority: 10,
    attempts: 0,
    max_attempts: 3,
    run_after: null,
    created_at: "2026-05-30T10:00:00.000Z",
    updated_at: "2026-05-30T10:00:00.000Z",
    locked_at: null,
    completed_at: null,
    last_error: null,
    idempotency_key: "job-key",
    entity_kind: "entry",
    entity_id: "entry-1",
    supersedes: [],
    ...overrides,
  };
}

test("queued reprocess plans against latest local source, not stale payload hash", () => {
  const plan = planEntryReprocessJob(
    queueJob({
      entry_id: "entry-1",
      source_text_hash: "a".repeat(64),
      reason: "manual_reprocess",
      requested_schema_version: CLIENT_ACTIVE_SCHEMA_VERSION,
      requested_prompt_version: CLIENT_ACTIVE_PROMPT_VERSION,
      queued_at: "2026-05-30T10:00:00.000Z",
    }),
    localEntry({
      source_text_hash: "c".repeat(64),
      text: "newer local text",
    }),
  );

  assert.equal(plan.action, "process");
  assert.equal(plan.sourceTextHash, "c".repeat(64));
  assert.equal(plan.reason, "manual_reprocess");
});

test("reprocess covers retryable provider failures and metric-empty sparse signals", () => {
  assert.equal(isRetryableProviderErrorCode("quota_error"), true);
  assert.equal(isRetryableProviderErrorCode("gemini_daily_limit"), true);
  assert.equal(
    getSignalReprocessReason(
      fallbackSignal(),
      metadata({ provider: "gemini", error_code: "quota_error" }),
    ),
    "provider_failure",
  );
  assert.equal(
    getSignalReprocessReason(sparseSignal(), metadata()),
    "sparse_no_metrics",
  );
});

test("current parse-error fallbacks do not loop through repeated reprocess", () => {
  assert.equal(
    isSignalReprocessCandidate(
      fallbackSignal(),
      metadata({ provider: "gemini", error_code: "parse_error" }),
    ),
    false,
  );
});

test("current sparse no-metrics signals do not loop after successful reprocess", () => {
  assert.equal(isSignalReprocessCandidate(sparseSignal(), metadata()), false);
});

test("reprocess payload is inspectable and does not carry raw text", () => {
  const payload = createEntryReprocessPayload({
    entryId: "entry-1",
    serverId: 1,
    sourceTextHash: "d".repeat(64),
    reason: "sparse_no_metrics",
  });

  assert.equal(payload.entry_id, "entry-1");
  assert.equal(payload.server_id, 1);
  assert.equal(payload.reason, "sparse_no_metrics");
  assert.equal(payload.requested_schema_version, CLIENT_ACTIVE_SCHEMA_VERSION);
  assert.equal(payload.requested_prompt_version, CLIENT_ACTIVE_PROMPT_VERSION);
  assert.equal("text" in payload, false);
});
