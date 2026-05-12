import {
  addQueueJob,
  assertQueueCanAcceptJob,
  compactQueueJobs,
  countQueueJobsByStatus,
  findQueueJobByIdempotencyKey,
  getLastQueueError,
  getQueueJob,
  getRunnableQueueJobs,
  recoverStaleRunningJobs,
  updateQueueJob,
  getQueueJobsByStatuses,
} from "./queueStorage";
import type {
  QueueHandler,
  QueueJob,
  QueueJobStatus,
  QueueJobType,
  QueueListener,
  QueueSnapshot,
} from "./queueTypes";

type EnqueueQueueJobInput<TPayload = unknown> = {
  type: QueueJobType;
  payload: TPayload;
  priority?: number;
  max_attempts?: number;
  run_after?: string | null;
  idempotency_key?: string;
  entity_kind?: string | null;
  entity_id?: string | null;
};

const DEFAULT_MAX_ATTEMPTS = 3;

let snapshot: QueueSnapshot = {
  queued: 0,
  running: 0,
  blocked: 0,
  failed: 0,
  cancelled: 0,
  succeeded: 0,
  lastError: null,
  isProcessing: false,
};

let processorStarted = false;
let processorPaused = false;
let activeAbortController: AbortController | null = null;
let wakeTimer: number | null = null;

const listeners = new Set<QueueListener>();
const handlers = new Map<QueueJobType, QueueHandler>();

function createQueueJobId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `queue-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function createIdempotencyKey(input: EnqueueQueueJobInput) {
  if (input.idempotency_key) return input.idempotency_key;

  const entityKind = input.entity_kind ?? "none";
  const entityId = input.entity_id ?? "none";

  return `${input.type}:${entityKind}:${entityId}:${Date.now()}`;
}

function emitQueueSnapshot() {
  for (const listener of listeners) {
    listener(snapshot);
  }
}

async function refreshQueueSnapshot() {
  const counts = await countQueueJobsByStatus();
  const lastError = await getLastQueueError();

  snapshot = {
    ...counts,
    lastError,
    isProcessing: snapshot.isProcessing,
  };

  emitQueueSnapshot();
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function clearWakeTimer() {
  if (wakeTimer !== null) {
    window.clearTimeout(wakeTimer);
    wakeTimer = null;
  }
}

async function scheduleNextRunAfterWake(): Promise<void> {
  clearWakeTimer();

  if (!processorStarted || processorPaused) return;

  const queuedJobs = await getQueueJobsByStatuses(["queued"]);
  const nextRunAt = queuedJobs
    .map((job) => (job.run_after ? new Date(job.run_after).getTime() : NaN))
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => a - b)[0];

  if (nextRunAt === undefined) return;

  wakeTimer = window.setTimeout(
    () => {
      wakeTimer = null;
      void processQueue();
    },
    Math.max(0, nextRunAt - Date.now()),
  );
}

function getRetryDelayMs(attempts: number) {
  if (attempts <= 1) return 5_000;
  if (attempts === 2) return 30_000;
  return 120_000;
}

function errorToMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown queue error";
  }
}

function isRetryableQueueError(error: unknown) {
  const message = errorToMessage(error).toLowerCase();

  if (message.includes("privacy")) return false;
  if (message.includes("validation")) return false;
  if (message.includes("schema")) return false;
  if (message.includes("400")) return false;
  if (message.includes("401")) return false;
  if (message.includes("403")) return false;
  if (message.includes("404")) return false;
  if (message.includes("409")) return false;

  if (message.includes("429")) return true;
  if (message.includes("timeout")) return true;
  if (message.includes("network")) return true;
  if (message.includes("failed to fetch")) return true;
  if (message.includes("backend")) return true;
  if (message.includes("500")) return true;
  if (message.includes("502")) return true;
  if (message.includes("503")) return true;
  if (message.includes("504")) return true;

  return false;
}

export function getQueueSnapshot(): QueueSnapshot {
  return snapshot;
}

export function subscribeToQueue(listener: QueueListener): () => void {
  listeners.add(listener);
  listener(snapshot);

  return () => {
    listeners.delete(listener);
  };
}

export function registerQueueHandler<TPayload>(
  type: QueueJobType,
  handler: QueueHandler<TPayload>,
): void {
  handlers.set(type, handler as QueueHandler);
}

export async function enqueueQueueJob<TPayload>(
  input: EnqueueQueueJobInput<TPayload>,
): Promise<QueueJob<TPayload>> {
  const idempotencyKey = createIdempotencyKey(input);

  const existingJob = await findQueueJobByIdempotencyKey(idempotencyKey);

  if (existingJob) {
    await refreshQueueSnapshot();
    return existingJob as QueueJob<TPayload>;
  }

  await assertQueueCanAcceptJob(input.priority ?? 0);

  const createdAt = nowIso();

  const job: QueueJob<TPayload> = {
    id: createQueueJobId(),
    type: input.type,
    version: 1,
    payload: input.payload,
    status: "queued",
    priority: input.priority ?? 0,
    attempts: 0,
    max_attempts: input.max_attempts ?? DEFAULT_MAX_ATTEMPTS,
    run_after: input.run_after ?? null,
    created_at: createdAt,
    updated_at: createdAt,
    locked_at: null,
    completed_at: null,
    last_error: null,
    idempotency_key: idempotencyKey,
    entity_kind: input.entity_kind ?? null,
    entity_id: input.entity_id ?? null,
    supersedes: [],
  };

  await addQueueJob(job);
  await refreshQueueSnapshot();

  void processQueue();

  return job;
}

export async function recoverStaleJobs(): Promise<void> {
  await recoverStaleRunningJobs();
  await compactQueueJobs();
  await refreshQueueSnapshot();
}

export function startQueue(): void {
  clearWakeTimer();
  processorPaused = false;
  processorStarted = true;

  snapshot = {
    ...snapshot,
    isProcessing: true,
  };

  emitQueueSnapshot();
  void processQueue();
}

export function pauseQueue(): void {
  clearWakeTimer();
  processorPaused = true;

  snapshot = {
    ...snapshot,
    isProcessing: false,
  };

  emitQueueSnapshot();
}

export async function retryQueueJob(jobId: string): Promise<void> {
  const job = await getQueueJob(jobId);
  if (!job) return;

  if (
    job.status !== "failed" &&
    job.status !== "cancelled" &&
    job.status !== "blocked"
  ) {
    return;
  }

  const updated: QueueJob = {
    ...job,
    status: "queued",
    run_after: null,
    locked_at: null,
    completed_at: null,
    last_error: null,
    updated_at: nowIso(),
  };

  await updateQueueJob(updated);
  await refreshQueueSnapshot();

  void processQueue();
}

export async function cancelQueueJob(jobId: string): Promise<void> {
  const job = await getQueueJob(jobId);
  if (!job) return;

  if (job.status === "succeeded" || job.status === "cancelled") return;

  if (job.status === "running") {
    activeAbortController?.abort();
  }

  const updated: QueueJob = {
    ...job,
    status: "cancelled",
    locked_at: null,
    completed_at: nowIso(),
    updated_at: nowIso(),
  };

  await updateQueueJob(updated);
  await refreshQueueSnapshot();
  void processQueue();
}

async function markJobRunning(job: QueueJob): Promise<QueueJob> {
  const updated: QueueJob = {
    ...job,
    status: "running",
    attempts: job.attempts + 1,
    locked_at: nowIso(),
    updated_at: nowIso(),
    last_error: null,
  };

  await updateQueueJob(updated);
  return updated;
}

async function markJobSucceeded(job: QueueJob): Promise<void> {
  await updateQueueJob({
    ...job,
    status: "succeeded",
    locked_at: null,
    completed_at: nowIso(),
    updated_at: nowIso(),
    last_error: null,
  });
}

async function markJobFailedOrRetry(job: QueueJob, error: unknown): Promise<void> {
  const message = errorToMessage(error);
  const retryable = isRetryableQueueError(error);
  const canRetry = retryable && job.attempts < job.max_attempts;

  const nextStatus: QueueJobStatus = canRetry ? "queued" : "failed";

  await updateQueueJob({
    ...job,
    status: nextStatus,
    locked_at: null,
    run_after: canRetry
      ? new Date(Date.now() + getRetryDelayMs(job.attempts)).toISOString()
      : job.run_after,
    completed_at: canRetry ? null : nowIso(),
    updated_at: nowIso(),
    last_error: message,
  });
}

async function processQueue(): Promise<void> {
  if (!processorStarted || processorPaused) return;

  const runnableJobs = await getRunnableQueueJobs();

  if (runnableJobs.length === 0) {
    snapshot = {
      ...snapshot,
      isProcessing: false,
    };
    emitQueueSnapshot();
    void scheduleNextRunAfterWake();
    return;
  }

  snapshot = {
    ...snapshot,
    isProcessing: true,
  };
  emitQueueSnapshot();

  const job = runnableJobs[0];
  const handler = handlers.get(job.type);

  if (!handler) {
    await updateQueueJob({
      ...job,
      status: "blocked",
      updated_at: nowIso(),
      last_error: `No queue handler registered for ${job.type}`,
    });

    await refreshQueueSnapshot();

    // Continue with other jobs, if any.
    await delay(0);
    void processQueue();
    return;
  }

  const runningJob = await markJobRunning(job);
  activeAbortController = new AbortController();

  await refreshQueueSnapshot();

  try {
    await handler(runningJob, activeAbortController.signal);

    if (activeAbortController.signal.aborted) {
      await updateQueueJob({
        ...runningJob,
        status: "cancelled",
        locked_at: null,
        completed_at: nowIso(),
        updated_at: nowIso(),
        last_error: "Job was cancelled.",
      });
    } else {
      await markJobSucceeded(runningJob);
    }
  } catch (error) {
    if (activeAbortController.signal.aborted) {
      await updateQueueJob({
        ...runningJob,
        status: "cancelled",
        locked_at: null,
        completed_at: nowIso(),
        updated_at: nowIso(),
        last_error: "Job was cancelled.",
      });
    } else {
      await markJobFailedOrRetry(runningJob, error);
    }
  } finally {
    activeAbortController = null;
    await refreshQueueSnapshot();
  }

  await delay(0);
  void processQueue();
}

export async function retryRecoverableQueueJobs(): Promise<void> {
  const jobs = await getQueueJobsByStatuses(["failed", "blocked"]);

  for (const job of jobs) {
    await updateQueueJob({
      ...job,
      status: "queued",
      run_after: null,
      locked_at: null,
      completed_at: null,
      last_error: null,
      updated_at: nowIso(),
    });
  }

  await refreshQueueSnapshot();
  void processQueue();
}
