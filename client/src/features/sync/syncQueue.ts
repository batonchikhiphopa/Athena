/**
 * Connects persisted queue job types to their feature handlers. Registration is
 * process-wide and idempotent, while the latest extraction settings stay mutable.
 */
import type { ExtractionSettings } from "../../types";
import { getLocalEntry } from "../../lib/storage";
import {
  handleSelfReportAggregateSyncJob,
  type SelfReportDailyAggregateQueuePayload,
} from "../selfReports/selfReportQueue";
import { reprocessLocalEntry } from "../settings/pendingReextract";
import { registerQueueHandler } from "../../lib/queue";
import type {
  EntryQueuePayload,
  EntrySyncQueuePayload,
  QueueJob,
} from "../../lib/queueTypes";
import { handleEntrySyncJob } from "./entrySyncJob";
import { planEntryReprocessJob } from "./reprocessPolicy";

let handlersRegistered = false;
let currentSettings: ExtractionSettings | null = null;

export function registerSyncQueueHandlers(settings: ExtractionSettings): void {
  currentSettings = settings;

  if (handlersRegistered) return;

  handlersRegistered = true;

  registerQueueHandler<EntrySyncQueuePayload>("entry.sync", handleEntrySyncJob);

  registerQueueHandler<EntryQueuePayload>(
    "entry.reprocess_signal",
    async (job, signal) => {
      await handleEntryReprocessSignalJob(
        job,
        currentSettings ?? settings,
        signal,
      );
    },
  );

  registerQueueHandler<SelfReportDailyAggregateQueuePayload>(
    "self_report.sync_daily_aggregate",
    handleSelfReportAggregateSyncJob,
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

  const entryId = getEntryId(job);

  if (!entryId) {
    throw new Error("validation: entry.reprocess_signal missing entry_id");
  }

  const entry = await getLocalEntry(entryId);
  const plan = planEntryReprocessJob(job, entry ?? null);

  if (plan.action === "skip") {
    return;
  }

  if (!entry) {
    return;
  }

  if (signal.aborted) {
    throw new Error("Job was cancelled.");
  }

  const result = await reprocessLocalEntry(entry, settings, signal);

  if (result.status === "retryable_provider_failure") {
    throw new Error(`retryable_provider_failure:${result.errorCode}`);
  }

  if (signal.aborted) {
    throw new Error("Job was cancelled.");
  }
}

function getEntryId(job: QueueJob<EntryQueuePayload>): string | null {
  const payload =
    typeof job.payload === "object" &&
    job.payload !== null &&
    !Array.isArray(job.payload)
      ? (job.payload as Record<string, unknown>)
      : {};

  const payloadEntryId = payload.entry_id;

  if (typeof payloadEntryId === "string" && payloadEntryId.trim()) {
    return payloadEntryId;
  }

  return job.entity_id;
}
