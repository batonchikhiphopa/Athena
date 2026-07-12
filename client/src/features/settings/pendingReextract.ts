import type { ExtractionSettings } from "../../shared/contracts";
import type { LocalEntry } from "../entries/entryTypes";
import { extractSignalForText } from "../extraction/extractSignalForText";
import {
  getAllLocalEntries,
  getLocalEntry,
  updateLocalEntry,
} from "../entries/localEntryRepository";
import { getRemainingGeminiDailyExtractions } from "../extraction/geminiQuota";
import { enqueueEntrySignalReprocessJob } from "../sync/entryReprocessJob";
import { enqueueEntrySyncJob } from "../sync/entrySyncJob";
import {
  getSignalReprocessReason,
  isRetryableProviderErrorCode,
  isSignalReprocessCandidate,
} from "../sync/reprocessPolicy";
import { syncLocalEntryToServer } from "../sync/entryServerSync";

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

  const latestEntry = await getLocalEntry(entry.id);

  if (
    !latestEntry ||
    latestEntry.source_text_hash !== entry.source_text_hash ||
    latestEntry.analysis_enabled === false
  ) {
    return {
      status: "processed",
    };
  }

  const localRevision = extraction.metadata.created_at ?? new Date().toISOString();
  const locallyUpdatedEntry = await updateLocalEntry(entry.id, {
    signals: extraction.signal,
    metadata: extraction.metadata,
    sync_status: "local_only",
    updatedAt: localRevision,
  });

  if (!locallyUpdatedEntry) {
    return {
      status: "processed",
    };
  }

  try {
    const serverEntry = await syncLocalEntryToServer(locallyUpdatedEntry);

    await updateLocalEntry(entry.id, {
      serverId: serverEntry.id,
      signals: serverEntry.signal ?? extraction.signal,
      metadata: serverEntry.metadata ?? extraction.metadata,
      sync_status: "synced",
      updatedAt: serverEntry.updated_at,
    });
  } catch (error) {
    console.warn("[entry:reprocess-sync]", error);
    await enqueueEntrySyncJob({
      entryId: locallyUpdatedEntry.id,
      sourceTextHash: locallyUpdatedEntry.source_text_hash,
      localRevision,
    }).catch((enqueueError) => {
      console.warn("[entry:enqueue-sync-after-reprocess]", enqueueError);
    });
  }

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
  const reprocessableEntries: LocalEntry[] = [];

  for (const entry of pendingEntries) {
    if (isSignalReprocessCandidate(entry.signals, entry.metadata)) {
      reprocessableEntries.push(entry);
      continue;
    }

    await releaseTerminalPendingReextractEntry(entry);
  }

  const processableEntries =
    settings.provider === "gemini"
      ? reprocessableEntries.slice(0, getRemainingGeminiDailyExtractions())
      : reprocessableEntries;

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

async function releaseTerminalPendingReextractEntry(entry: LocalEntry) {
  const releasedEntry = await updateLocalEntry(entry.id, {
    sync_status: "local_only",
  });

  if (!releasedEntry) return;

  await enqueueEntrySyncJob({
    entryId: releasedEntry.id,
    sourceTextHash: releasedEntry.source_text_hash,
    localRevision: releasedEntry.updatedAt,
  }).catch((error) => {
    console.warn("[entry:release-pending-reextract-sync]", error);
  });
}
