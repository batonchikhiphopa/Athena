import type { ExtractionSettings, LocalEntry } from "../../types";
import { createEntry, updateServerEntry } from "../../lib/api";
import { enqueueQueueJob } from "../../lib/queue";
import { extractSignalForText } from "../../lib/extraction";
import {
  getAllLocalEntries,
  getRemainingGeminiDailyExtractions,
  updateLocalEntry,
} from "../../lib/storage";

const RETRYABLE_PROVIDER_LIMIT_CODES = ["gemini_daily_limit", "quota_error"];

export async function reprocessLocalEntry(
  entry: LocalEntry,
  settings: ExtractionSettings,
): Promise<"processed" | "provider_limit"> {
  const extraction = await extractSignalForText(entry.text, settings);

  if (
    extraction.signal.signal_quality === "fallback" &&
    RETRYABLE_PROVIDER_LIMIT_CODES.includes(extraction.metadata.error_code ?? "")
  ) {
    return "provider_limit";
  }

  const payload = {
    entry_date: entry.entry_date,
    tags: entry.tags,
    source_text_hash: entry.source_text_hash,
    signal: extraction.signal,
    metadata: extraction.metadata,
  };

  const serverEntry = entry.serverId
    ? await updateServerEntry(entry.serverId, payload)
    : await createEntry({
        client_entry_id: entry.id,
        ...payload,
      });

  await updateLocalEntry(entry.id, {
    serverId: serverEntry.id,
    signals: serverEntry.signal ?? extraction.signal,
    metadata: serverEntry.metadata ?? extraction.metadata,
    sync_status: "synced",
    updatedAt: serverEntry.updated_at,
  });

  return "processed";
}

export async function processPendingReextractEntries(
  settings: ExtractionSettings,
) {
  const pendingEntries = (await getAllLocalEntries()).filter(
    (entry) =>
      entry.sync_status === "pending_reextract" &&
      entry.analysis_enabled !== false,
  );

  const processableEntries =
    settings.provider === "gemini"
      ? pendingEntries.slice(0, getRemainingGeminiDailyExtractions())
      : pendingEntries;

  for (const entry of processableEntries) {
    try {
      await enqueueQueueJob({
        type: "entry.reprocess_signal",
        payload: {
          entry_id: entry.id,
          server_id: entry.serverId ?? null,
          source_text_hash: entry.source_text_hash,
        },
        priority: 10,
        entity_kind: "entry",
        entity_id: entry.id,
        idempotency_key: createReprocessJobIdempotencyKey(entry),
      });
    } catch (error) {
      console.warn("[entry:enqueue-reprocess]", error);
    }
  }
}

function createReprocessJobIdempotencyKey(entry: LocalEntry) {
  return `entry.reprocess_signal:entry:${entry.id}:${entry.source_text_hash}`;
}