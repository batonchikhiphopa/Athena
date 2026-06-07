import type { ExtractionSettings, LocalEntry } from "../../types";
import { createEntry, updateServerEntry } from "../entries/entriesApi";
import { extractSignalForText } from "../../lib/extraction";
import {
  getAllLocalEntries,
  getRemainingGeminiDailyExtractions,
  updateLocalEntry,
} from "../../lib/storage";
import { enqueueEntrySignalReprocessJob } from "../sync/entryReprocessJob";
import {
  getSignalReprocessReason,
  isRetryableProviderErrorCode,
} from "../sync/reprocessPolicy";

export async function reprocessLocalEntry(
  entry: LocalEntry,
  settings: ExtractionSettings,
  signal?: AbortSignal,
): Promise<
  | {
      status: "processed";
    }
  | {
      status: "retryable_provider_failure";
      errorCode: string;
    }
> {
  const extraction = await extractSignalForText(
    entry.text,
    settings,
    {
      entryDate: entry.entry_date,
      capturedAt: entry.updatedAt,
    },
    signal,
  );

  if (
    extraction.signal.signal_quality === "fallback" &&
    isRetryableProviderErrorCode(extraction.metadata.error_code)
  ) {
    return {
      status: "retryable_provider_failure",
      errorCode: extraction.metadata.error_code ?? "provider_error",
    };
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

  return {
    status: "processed",
  };
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
      await enqueueEntrySignalReprocessJob({
        entryId: entry.id,
        serverId: entry.serverId,
        sourceTextHash: entry.source_text_hash,
        reason: getSignalReprocessReason(entry.signals, entry.metadata),
      });
    } catch (error) {
      console.warn("[entry:enqueue-reprocess]", error);
    }
  }
}
