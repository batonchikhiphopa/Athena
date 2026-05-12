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
  isProcessing: boolean;
};

export type QueueHandler<TPayload = unknown> = (
  job: QueueJob<TPayload>,
  signal: AbortSignal,
) => Promise<void>;

export type QueueListener = (snapshot: QueueSnapshot) => void;

export type EntryQueuePayload = {
  entry_id: string;
  local_revision?: string;
  server_id?: number | null;
  source_text_hash?: string;
};