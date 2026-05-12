import type { ExtractionSettings } from "../../types";
import { registerQueueHandler } from "../../lib/queue";
import type { EntryQueuePayload, QueueJob } from "../../lib/queueTypes";
import { getLocalEntry } from "../../lib/storage";
import { reprocessLocalEntry } from "../settings/pendingReextract";

let handlersRegistered = false;
let currentSettings: ExtractionSettings | null = null;

export function registerSyncQueueHandlers(settings: ExtractionSettings): void {
  currentSettings = settings;

  if (handlersRegistered) return;

  handlersRegistered = true;

  registerQueueHandler<EntryQueuePayload>(
    "entry.reprocess_signal",
    async (job, signal) => {
      await handleEntryReprocessSignalJob(job, currentSettings ?? settings, signal);
    },
  );
}

async function handleEntryReprocessSignalJob(
  job: QueueJob<EntryQueuePayload>,
  settings: ExtractionSettings,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) {
    throw new Error("Job was cancelled.");
  }

  const entryId = job.payload.entry_id;

  if (!entryId) {
    throw new Error("validation: entry.reprocess_signal missing entry_id");
  }

  const entry = await getLocalEntry(entryId);

  if (!entry) {
    // Local source disappeared. For local-first flow this job has nothing left
    // to do. Treat as successful no-op.
    return;
  }

  if (entry.analysis_enabled === false) {
    // User disabled analysis after the job was created.
    // Do not run extraction.
    return;
  }

  if (entry.sync_status !== "pending_reextract") {
    // Stale job. Current local state no longer needs reprocessing.
    return;
  }

  if (signal.aborted) {
    throw new Error("Job was cancelled.");
  }

  const result = await reprocessLocalEntry(entry, settings);

  if (result === "provider_limit") {
    throw new Error("429 quota_error: provider limit reached");
  }

  if (signal.aborted) {
    throw new Error("Job was cancelled.");
  }
}
