import { openAthenaLocalDb, QUEUE_JOBS_STORE } from "./storage";
import type { QueueJob, QueueJobStatus } from "./queueTypes";

const STALE_RUNNING_LOCK_TIMEOUT_MS = 2 * 60 * 1000;

const MAX_NON_TERMINAL_JOBS = 500;
const HARD_MAX_STORED_JOBS = 1000;
const TERMINAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const FAILED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

const TERMINAL_STATUSES = new Set<QueueJobStatus>([
  "succeeded",
  "cancelled",
]);

const NON_TERMINAL_STATUSES = new Set<QueueJobStatus>([
  "queued",
  "running",
  "blocked",
]);

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openTransaction(
  db: IDBDatabase,
  mode: IDBTransactionMode,
): IDBObjectStore {
  const transaction = db.transaction(QUEUE_JOBS_STORE, mode);
  return transaction.objectStore(QUEUE_JOBS_STORE);
}

export async function addQueueJob(job: QueueJob): Promise<QueueJob> {
  const db = await openAthenaLocalDb();

  try {
    const store = openTransaction(db, "readwrite");
    await promisifyRequest(store.add(job));
    return job;
  } finally {
    db.close();
  }
}

export async function updateQueueJob(job: QueueJob): Promise<QueueJob> {
  const db = await openAthenaLocalDb();

  try {
    const store = openTransaction(db, "readwrite");
    await promisifyRequest(store.put(job));
    return job;
  } finally {
    db.close();
  }
}

export async function getQueueJob(id: string): Promise<QueueJob | null> {
  const db = await openAthenaLocalDb();

  try {
    const store = openTransaction(db, "readonly");
    const job = await promisifyRequest<QueueJob | undefined>(store.get(id));

    return job ?? null;
  } finally {
    db.close();
  }
}

export async function getQueueJobs(): Promise<QueueJob[]> {
  const db = await openAthenaLocalDb();

  try {
    const store = openTransaction(db, "readonly");
    return await promisifyRequest<QueueJob[]>(store.getAll());
  } finally {
    db.close();
  }
}

export async function getRunnableQueueJobs(
  nowIso = new Date().toISOString(),
): Promise<QueueJob[]> {
  const jobs = await getQueueJobs();

  return jobs
    .filter((job) => {
      if (job.status !== "queued") return false;
      if (!job.run_after) return true;
      return job.run_after <= nowIso;
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }

      const aRunAfter = a.run_after ?? "";
      const bRunAfter = b.run_after ?? "";

      if (aRunAfter !== bRunAfter) {
        return aRunAfter.localeCompare(bRunAfter);
      }

      return a.created_at.localeCompare(b.created_at);
    });
}

export async function recoverStaleRunningJobs(
  lockTimeoutMs = STALE_RUNNING_LOCK_TIMEOUT_MS,
): Promise<QueueJob[]> {
  const jobs = await getQueueJobs();
  const now = Date.now();
  const recovered: QueueJob[] = [];

  for (const job of jobs) {
    if (job.status !== "running") continue;
    if (!job.locked_at) continue;

    const lockedAt = new Date(job.locked_at).getTime();

    if (!Number.isFinite(lockedAt)) continue;
    if (now - lockedAt < lockTimeoutMs) continue;

    const recoveredJob: QueueJob = {
      ...job,
      status: "queued",
      locked_at: null,
      updated_at: new Date().toISOString(),
      last_error: job.last_error ?? "Recovered stale running job.",
    };

    await updateQueueJob(recoveredJob);
    recovered.push(recoveredJob);
  }

  return recovered;
}

export async function countQueueJobsByStatus(): Promise<
  Record<QueueJobStatus, number>
> {
  const jobs = await getQueueJobs();

  return jobs.reduce<Record<QueueJobStatus, number>>(
    (counts, job) => {
      counts[job.status] += 1;
      return counts;
    },
    {
      queued: 0,
      running: 0,
      blocked: 0,
      succeeded: 0,
      failed: 0,
      cancelled: 0,
    },
  );
}

export async function getLastQueueError(): Promise<string | null> {
  const jobs = await getQueueJobs();

  const jobsWithErrors = jobs
    .filter((job) => job.last_error)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return jobsWithErrors[0]?.last_error ?? null;
}

export async function replaceQueueJob(job: QueueJob): Promise<QueueJob> {
  return updateQueueJob(job);
}

export async function findQueueJobByIdempotencyKey(
  idempotencyKey: string,
): Promise<QueueJob | null> {
  const jobs = await getQueueJobs();

  return (
    jobs.find(
      (job) =>
        job.idempotency_key === idempotencyKey &&
        NON_TERMINAL_STATUSES.has(job.status),
    ) ?? null
  );
}

export async function deleteQueueJob(id: string): Promise<void> {
  const db = await openAthenaLocalDb();

  try {
    const store = openTransaction(db, "readwrite");
    await promisifyRequest(store.delete(id));
  } finally {
    db.close();
  }
}

export async function compactQueueJobs(): Promise<void> {
  const jobs = await getQueueJobs();
  const now = Date.now();

  const expiredTerminalJobs = jobs.filter((job) => {
    if (job.status === "running") return false;

    const completedAt = job.completed_at
      ? new Date(job.completed_at).getTime()
      : null;

    const updatedAt = new Date(job.updated_at).getTime();
    const timestamp = Number.isFinite(completedAt)
      ? completedAt
      : Number.isFinite(updatedAt)
        ? updatedAt
        : null;

    if (timestamp === null) return false;

    if (TERMINAL_STATUSES.has(job.status)) {
      return now - timestamp > TERMINAL_RETENTION_MS;
    }

    if (job.status === "failed") {
      return now - timestamp > FAILED_RETENTION_MS;
    }

    return false;
  });

  for (const job of expiredTerminalJobs) {
    await deleteQueueJob(job.id);
  }

  const afterExpiryPrune = await getQueueJobs();

  if (afterExpiryPrune.length <= HARD_MAX_STORED_JOBS) return;

  const removableJobs = afterExpiryPrune
    .filter((job) => job.status !== "running")
    .filter((job) => job.status === "succeeded" || job.status === "cancelled")
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));

  const excess = afterExpiryPrune.length - HARD_MAX_STORED_JOBS;

  for (const job of removableJobs.slice(0, excess)) {
    await deleteQueueJob(job.id);
  }
}

export async function assertQueueCanAcceptJob(
  priority: number,
): Promise<void> {
  await compactQueueJobs();

  const jobs = await getQueueJobs();

  const nonTerminalCount = jobs.filter((job) =>
    NON_TERMINAL_STATUSES.has(job.status),
  ).length;

  if (nonTerminalCount >= MAX_NON_TERMINAL_JOBS && priority <= 0) {
    throw new Error("queue_full: too many active queue jobs");
  }

  if (jobs.length >= HARD_MAX_STORED_JOBS && priority <= 0) {
    throw new Error("queue_full: hard queue storage limit reached");
  }
}

export async function getQueueJobsByStatuses(
  statuses: QueueJobStatus[],
): Promise<QueueJob[]> {
  const allowed = new Set(statuses);
  const jobs = await getQueueJobs();

  return jobs.filter((job) => allowed.has(job.status));
}