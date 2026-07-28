import type {
  EntryReprocessReason,
  EntryQueuePayload,
  QueueJob,
} from "./queueTypes";
import {
  CLIENT_ACTIVE_PROMPT_VERSION,
  CLIENT_ACTIVE_SCHEMA_VERSION,
} from "../extraction/signalVersions";
import type { Signal, SignalMetadata } from "../../shared/contracts";
import type { LocalEntry } from "../entries/entryTypes";

const RETRYABLE_PROVIDER_ERROR_CODES = new Set([
  "backend_unavailable",
  "gemini_daily_limit",
  "ollama_unavailable",
  "provider_error",
  "quota_error",
  "timeout",
]);

export type EntryReprocessPlan =
  | {
      action: "process";
      entryId: string;
      reason: EntryReprocessReason;
      sourceTextHash: string;
    }
  | {
      action: "skip";
      reason:
        | "analysis_disabled"
        | "contract_mismatch"
        | "entry_missing"
        | "not_pending_reextract"
        | "validation_missing_entry_id";
    };

export function isRetryableProviderErrorCode(errorCode: string | null | undefined) {
  return errorCode ? RETRYABLE_PROVIDER_ERROR_CODES.has(errorCode) : false;
}

export function isMetricEmptySignal(signal: Signal) {
  return signal.load === null && signal.fatigue === null && signal.focus === null;
}

export function isMetricEmptySparseSignal(signal: Signal) {
  return signal.signal_quality === "sparse" && isMetricEmptySignal(signal);
}

export function hasCurrentSignalContract(metadata: SignalMetadata) {
  return (
    metadata.schema_version === CLIENT_ACTIVE_SCHEMA_VERSION &&
    metadata.prompt_version === CLIENT_ACTIVE_PROMPT_VERSION
  );
}

export function getSignalReprocessReason(
  signal: Signal,
  metadata: SignalMetadata,
  explicitReason?: unknown,
): EntryReprocessReason {
  const normalizedExplicitReason = normalizeEntryReprocessReason(explicitReason);
  if (normalizedExplicitReason) return normalizedExplicitReason;
  if (isRetryableProviderErrorCode(metadata.error_code)) return "provider_failure";
  if (signal.signal_quality === "fallback") return "fallback";
  if (isMetricEmptySparseSignal(signal)) return "sparse_no_metrics";

  return "manual_reprocess";
}

export function isSignalReprocessCandidate(
  signal: Signal,
  metadata: SignalMetadata,
) {
  if (!hasCurrentSignalContract(metadata)) return false;

  return (
    isFallbackReprocessCandidate(signal, metadata) ||
    isSparseNoMetricsReprocessCandidate(signal, metadata) ||
    isRetryableProviderErrorCode(metadata.error_code)
  );
}

export function isFallbackReprocessCandidate(
  signal: Signal,
  metadata: SignalMetadata,
) {
  if (signal.signal_quality !== "fallback") return false;
  if (!hasCurrentSignalContract(metadata)) return false;
  return true;
}

export function isSparseNoMetricsReprocessCandidate(
  signal: Signal,
  metadata: SignalMetadata,
) {
  if (!isMetricEmptySparseSignal(signal)) return false;
  if (!hasCurrentSignalContract(metadata)) return false;

  return isRetryableProviderErrorCode(metadata.error_code);
}

export function createEntryReprocessPayload({
  entryId,
  serverId,
  sourceTextHash,
  reason,
}: {
  entryId: string;
  serverId?: number | null;
  sourceTextHash: string;
  reason: EntryReprocessReason;
}): EntryQueuePayload {
  return {
    entry_id: entryId,
    server_id: serverId ?? null,
    source_text_hash: sourceTextHash,
    reason,
    requested_schema_version: CLIENT_ACTIVE_SCHEMA_VERSION,
    requested_prompt_version: CLIENT_ACTIVE_PROMPT_VERSION,
    queued_at: new Date().toISOString(),
  };
}

export function createEntryReprocessJobIdempotencyKey({
  entryId,
  sourceTextHash,
  reason,
}: {
  entryId: string;
  sourceTextHash: string;
  reason: EntryReprocessReason;
}) {
  return `entry.reprocess_signal:entry:${entryId}:${sourceTextHash}:${reason}`;
}

export function planEntryReprocessJob(
  job: QueueJob<EntryQueuePayload>,
  entry: LocalEntry | null | undefined,
): EntryReprocessPlan {
  const payload = getPayloadRecord(job.payload);
  const entryId = readNonEmptyString(payload.entry_id);

  if (!entryId) {
    return {
      action: "skip",
      reason: "validation_missing_entry_id",
    };
  }

  if (!entry) {
    return {
      action: "skip",
      reason: "entry_missing",
    };
  }

  if (
    payload.requested_schema_version !== CLIENT_ACTIVE_SCHEMA_VERSION ||
    payload.requested_prompt_version !== CLIENT_ACTIVE_PROMPT_VERSION
  ) {
    return {
      action: "skip",
      reason: "contract_mismatch",
    };
  }

  if (entry.analysis_enabled === false) {
    return {
      action: "skip",
      reason: "analysis_disabled",
    };
  }

  if (entry.sync_status !== "pending_reextract") {
    return {
      action: "skip",
      reason: "not_pending_reextract",
    };
  }

  return {
    action: "process",
    entryId,
    reason: getSignalReprocessReason(
      entry.signals,
      entry.metadata,
      payload.reason,
    ),
    sourceTextHash: entry.source_text_hash,
  };
}

function normalizeEntryReprocessReason(
  value: unknown,
): EntryReprocessReason | undefined {
  return value === "fallback" ||
    value === "sparse_no_metrics" ||
    value === "provider_failure" ||
    value === "manual_reprocess"
    ? value
    : undefined;
}

function getPayloadRecord(payload: unknown): Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload)
    ? (payload as Record<string, unknown>)
    : {};
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}
