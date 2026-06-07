export type QueueJobStatus =
  | "queued"
  | "running"
  | "blocked"
  | "succeeded"
  | "failed"
  | "cancelled";

export type QueueJobType =
  | "entry.sync"
  | "entry.delete_remote"
  | "entry.extract"
  | "entry.append_signal"
  | "entry.reprocess_signal"
  | "self_report.sync_daily_aggregate"
  | "semantic.index_entry"
  | "semantic.reindex_all";

export type EntryReprocessReason =
  | "fallback"
  | "sparse_no_metrics"
  | "provider_failure"
  | "manual_reprocess";

export type QueueJobSummary = {
  id: string;
  type: QueueJobType;
  status: QueueJobStatus;
  reason: string | null;
  entity_id: string | null;
  updated_at: string;
  run_after: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
};

export type QueueJob<TPayload = unknown> = {
  id: string;
  type: QueueJobType;
  version: number;
  payload: TPayload;
  status: QueueJobStatus;
  priority: number;
  attempts: number;
  max_attempts: number;
  run_after: string | null;
  created_at: string;
  updated_at: string;
  locked_at: string | null;
  completed_at: string | null;
  last_error: string | null;
  idempotency_key: string;
  entity_kind: string | null;
  entity_id: string | null;
  supersedes: string[];
};

export type QueueSnapshot = {
  queued: number;
  running: number;
  blocked: number;
  failed: number;
  cancelled: number;
  succeeded: number;
  lastError: string | null;
  latestJob: QueueJobSummary | null;
  isProcessing: boolean;
};

export type QueueHandler<TPayload = unknown> = (
  job: QueueJob<TPayload>,
  signal: AbortSignal,
) => Promise<void>;

export type QueueListener = (snapshot: QueueSnapshot) => void;

export type EntryQueuePayload = {
  entry_id?: string;
  local_revision?: string;
  server_id?: number | null;
  source_text_hash?: string;
  reason?: EntryReprocessReason;
  requested_schema_version?: string;
  requested_prompt_version?: string;
  queued_at?: string;
};

export type EntrySyncQueuePayload = {
  entry_id: string;
  source_text_hash: string;
  local_revision: string;
  queued_at: string;
};