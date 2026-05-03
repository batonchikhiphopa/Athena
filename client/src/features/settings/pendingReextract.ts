import type { ExtractionSettings } from "../../types";
import { createEntry, updateServerEntry } from "../../lib/api";
import { extractSignalForText } from "../../lib/extraction";
import {
  getAllLocalEntries,
  getRemainingGeminiDailyExtractions,
  updateLocalEntry,
} from "../../lib/storage";

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
      const extraction = await extractSignalForText(entry.text, settings);

      if (
        extraction.signal.signal_quality === "fallback" &&
        ["gemini_daily_limit", "quota_error"].includes(
          extraction.metadata.error_code ?? "",
        )
      ) {
        break;
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
    } catch (error) {
      console.warn("[entry:pending-reextract]", error);
    }
  }
}
