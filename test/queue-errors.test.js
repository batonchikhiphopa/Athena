import test from "node:test";
import assert from "node:assert/strict";

import {
  QueueJobError,
  classifyQueueError,
  queueBlocked,
  queueCancelled,
  queueConflict,
  queueRetryable,
  serializeQueueError,
} from "../client/src/features/sync/queueErrors.ts";

test("explicit queue errors preserve kind, code, and message", () => {
  const error = queueRetryable(
    "backend_unavailable",
    "Backend is temporarily unavailable.",
  );

  assert.equal(error instanceof QueueJobError, true);

  const classified = classifyQueueError(error);

  assert.equal(classified.kind, "retryable");
  assert.equal(classified.code, "backend_unavailable");
  assert.equal(classified.message, "Backend is temporarily unavailable.");
});

test("network and provider failures classify as retryable", () => {
  assert.equal(
    classifyQueueError(new Error("Failed to fetch")).kind,
    "retryable",
  );

  assert.equal(
    classifyQueueError(new Error("quota_error: Gemini daily limit reached")).kind,
    "retryable",
  );

  assert.equal(
    classifyQueueError({ status: 503, message: "Service unavailable" }).kind,
    "retryable",
  );
});

test("validation privacy schema and missing local entry classify as blocked", () => {
  assert.equal(
    classifyQueueError(new Error("validation failed")).kind,
    "blocked",
  );

  assert.equal(
    classifyQueueError(new Error("privacy boundary violation")).code,
    "privacy_boundary_violation",
  );

  assert.equal(
    classifyQueueError(new Error("schema error")).code,
    "schema_error",
  );

  assert.equal(
    classifyQueueError(new Error("missing local entry")).code,
    "missing_local_entry",
  );

  assert.equal(
    classifyQueueError({ status: 404, message: "Not found" }).kind,
    "blocked",
  );
});

test("source hash mismatch and 409 classify as conflict", () => {
  assert.equal(
    classifyQueueError(new Error("source_hash_mismatch")).kind,
    "conflict",
  );

  assert.equal(
    classifyQueueError({ status: 409, message: "Conflict" }).code,
    "backend_conflict",
  );

  const explicit = classifyQueueError(
    queueConflict("source_hash_mismatch", "Local source changed."),
  );

  assert.equal(explicit.kind, "conflict");
  assert.equal(explicit.code, "source_hash_mismatch");
});

test("abort and explicit cancellation classify as cancelled", () => {
  const abortError = new Error("The operation was aborted.");
  abortError.name = "AbortError";

  assert.equal(classifyQueueError(abortError).kind, "cancelled");

  const explicit = classifyQueueError(queueCancelled("Stopped."));

  assert.equal(explicit.kind, "cancelled");
  assert.equal(explicit.code, "cancelled");
});

test("serializeQueueError includes code and message", () => {
  const message = serializeQueueError(
    queueBlocked("validation_error", "Invalid payload."),
  );

  assert.equal(message, "validation_error: Invalid payload.");
});
