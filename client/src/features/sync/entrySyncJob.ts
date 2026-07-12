import { enqueueQueueJob } from "./queue";
import {
  queueBlocked,
  queueCancelled,
  queueConflict,
} from "./queueErrors";
import {
  getLocalEntry,
  updateLocalEntry,
} from "../entries/localEntryRepository";
import type { EntrySyncQueuePayload, QueueJob } from "./queueTypes";
import type { LocalEntry } from "../entries/entryTypes";
import { syncLocalEntryToServer } from "./entryServerSync";
import { planEntrySyncJob } from "./entrySyncPolicy";

type EnqueueEntrySyncJobInput = {
  entryId: string;
  sourceTextHash: string;
  localRevision: string;
};

type CreateEntrySyncQueuePayloadInput = {
  entryId: string;
  sourceTextHash: string;
  localRevision: string;
  queuedAt?: string;
};

const ENTRY_SYNC_PAYLOAD_KEYS = [
  "entry_id",
  "source_text_hash",
  "local_revision",
  "queued_at",
] as const;

export async function enqueueEntrySyncJob({
  entryId,
  sourceTextHash,
  localRevision,
}: EnqueueEntrySyncJobInput) {
  const payload = createEntrySyncQueuePayload({
    entryId,
    sourceTextHash,
    localRevision,
  });

  return enqueueQueueJob<EntrySyncQueuePayload>({
    type: "entry.sync",
    payload,
    priority: 20,
    max_attempts: 3,
    entity_kind: "entry",
    entity_id: entryId,
    idempotency_key: createEntrySyncIdempotencyKey(payload),
  });
}

export function createEntrySyncQueuePayload({
  entryId,
  sourceTextHash,
  localRevision,
  queuedAt = new Date().toISOString(),
}: CreateEntrySyncQueuePayloadInput): EntrySyncQueuePayload {
  return validateEntrySyncQueuePayload({
    entry_id: entryId,
    source_text_hash: sourceTextHash,
    local_revision: localRevision,
    queued_at: queuedAt,
  });
}

export function createEntrySyncIdempotencyKey(
  payload: EntrySyncQueuePayload,
): string {
  return [
    "entry.sync",
    "entry",
    payload.entry_id,
    payload.source_text_hash,
    payload.local_revision,
  ].join(":");
}

export function validateEntrySyncQueuePayload(
  payload: unknown,
): EntrySyncQueuePayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    Array.isArray(payload)
  ) {
    throw queueBlocked("malformed_payload", "entry.sync payload is malformed.");
  }

  const record = payload as Record<string, unknown>;

  const hasOnlyAllowedKeys = Object.keys(record).every((key) =>
    (ENTRY_SYNC_PAYLOAD_KEYS as readonly string[]).includes(key),
  );

  if (!hasOnlyAllowedKeys) {
    throw queueBlocked(
      "malformed_payload",
      "entry.sync payload contains unsupported fields.",
    );
  }

  if (
    typeof record.entry_id !== "string" ||
    !record.entry_id.trim() ||
    typeof record.source_text_hash !== "string" ||
    !/^[a-f0-9]{64}$/.test(record.source_text_hash) ||
    typeof record.local_revision !== "string" ||
    !record.local_revision.trim() ||
    typeof record.queued_at !== "string" ||
    !record.queued_at.trim()
  ) {
    throw queueBlocked("malformed_payload", "entry.sync payload is malformed.");
  }

  return {
    entry_id: record.entry_id,
    source_text_hash: record.source_text_hash,
    local_revision: record.local_revision,
    queued_at: record.queued_at,
  };
}

export async function handleEntrySyncJob(
  job: QueueJob<EntrySyncQueuePayload>,
  signal: AbortSignal,
): Promise<void> {
  throwIfAborted(signal);

  const payload = validateEntrySyncQueuePayload(job.payload);
  const entry = await getLocalEntry(payload.entry_id);

  const plan = planEntrySyncJob(payload, entry ?? null);

  if (plan.action === "skip") {
    return;
  }

  if (plan.action === "block") {
    throw queueBlocked(plan.code, plan.message);
  }

  if (plan.action === "conflict") {
    throw queueConflict(plan.code, plan.message);
  }

  if (!entry) {
    throw queueBlocked(
      "missing_local_entry",
      `Local entry ${payload.entry_id} was not found.`,
    );
  }

  throwIfAborted(signal);

  const syncedEntry = await syncLocalEntryToServer(entry);

  throwIfAborted(signal);

  await persistSyncResultIfStillCurrent(entry, syncedEntry.id);
}

async function persistSyncResultIfStillCurrent(
  syncedSource: LocalEntry,
  serverId: number,
): Promise<void> {
  const latestEntry = await getLocalEntry(syncedSource.id);

  if (!latestEntry) return;

  const isSameLocalRevision =
    latestEntry.source_text_hash === syncedSource.source_text_hash &&
    latestEntry.updatedAt === syncedSource.updatedAt;

  if (isSameLocalRevision) {
    await updateLocalEntry(latestEntry.id, {
      serverId,
      sync_status: "synced",
      updatedAt: latestEntry.updatedAt,
    });
    return;
  }

  await updateLocalEntry(latestEntry.id, {
    serverId,
    updatedAt: latestEntry.updatedAt,
  });
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) {
    throw queueCancelled("entry.sync was cancelled.");
  }
}
