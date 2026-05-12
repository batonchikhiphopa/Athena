import { useCallback, useState } from "react";
import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../../types";
import { loadExtractionConfig, loadExtractionStatus } from "../../lib/api";
import { enqueueQueueJob } from "../../lib/queue";
import {
  GEMINI_DAILY_EXTRACTION_LIMIT,
  getDebugMode,
  getExtractionSettings,
  getRemainingGeminiDailyExtractions,
  getPersonaTextEnabled,
  setDebugMode as persistDebugMode,
  setExtractionSettings as persistExtractionSettings,
  setPersonaTextEnabled as persistPersonaTextEnabled,
  updateLocalEntry,
} from "../../lib/storage";
import {
  DEFAULT_EXTRACTION_SETTINGS,
  normalizeExtractionSettings,
} from "./extractionSettings";

export type ReprocessStatus = "idle" | "running" | "done" | "error";

type ReprocessCallbacks = {
  refreshEntries: () => Promise<EntryView[]>;
  refreshInsights: () => Promise<void>;
  refreshObservationHistory: () => Promise<void>;
};

export function useSettingsState() {
  const [debugMode, setDebugMode] = useState(() => getDebugMode());
  const [personaTextEnabled, setPersonaTextEnabled] = useState(() =>
    getPersonaTextEnabled(),
  );
  const [extractionConfig, setExtractionConfig] =
    useState<ExtractionConfig | null>(null);
  const [extractionSettings, setExtractionSettings] =
    useState<ExtractionSettings>(DEFAULT_EXTRACTION_SETTINGS);
  const [extractionStatus, setExtractionStatus] =
    useState<ExtractionStatus | null>(null);
  const [reprocessStatus, setReprocessStatus] =
    useState<ReprocessStatus>("idle");
  const [reprocessMessage, setReprocessMessage] = useState("");

  const refreshExtractionStatus = useCallback(
    async (settings: ExtractionSettings) => {
      try {
        setExtractionStatus(await loadExtractionStatus(settings));
      } catch (error) {
        console.warn("[extraction:status] unavailable:", error);
        setExtractionStatus({
          ...settings,
          available: false,
          reason: "backend_unavailable",
        });
      }
    },
    [],
  );

  const initializeExtractionSettings = useCallback(async () => {
    let config: ExtractionConfig | null = null;
    try {
      config = await loadExtractionConfig();
    } catch (error) {
      console.warn("[extraction:config] unavailable:", error);
    }

    const nextExtractionSettings = normalizeExtractionSettings(
      getExtractionSettings() ?? config?.defaults ?? DEFAULT_EXTRACTION_SETTINGS,
      config,
    );

    setExtractionConfig(config);
    setExtractionSettings(nextExtractionSettings);
    persistExtractionSettings(nextExtractionSettings);
    await refreshExtractionStatus(nextExtractionSettings);

    return nextExtractionSettings;
  }, [refreshExtractionStatus]);

  async function changeExtractionSettings(nextValue: ExtractionSettings) {
    const normalized = normalizeExtractionSettings(nextValue, extractionConfig);

    setExtractionSettings(normalized);
    persistExtractionSettings(normalized);
    setReprocessStatus("idle");
    setReprocessMessage("");
    await refreshExtractionStatus(normalized);
  }

  function toggleDebugMode(nextValue: boolean) {
    setDebugMode(nextValue);
    persistDebugMode(nextValue);
  }

  function togglePersonaText(nextValue: boolean) {
    setPersonaTextEnabled(nextValue);
    persistPersonaTextEnabled(nextValue);
  }

  async function reprocessFallbackEntries(
    entries: EntryView[],
    callbacks: ReprocessCallbacks,
  ) {
    const candidates = entries.filter(
      (entry) =>
        entry.analysisEnabled &&
        entry.signals.signal_quality === "fallback" &&
        entry.text,
    );
    const remainingGeminiExtractions =
      extractionSettings.provider === "gemini"
        ? getRemainingGeminiDailyExtractions()
        : Number.POSITIVE_INFINITY;
    const processableCandidates = candidates.slice(0, remainingGeminiExtractions);
    const skippedByGeminiLimit = candidates.length - processableCandidates.length;

    setReprocessStatus("running");
    setReprocessMessage(
      extractionSettings.provider === "gemini"
        ? `В очереди: ${processableCandidates.length}/${candidates.length}, Gemini осталось: ${remainingGeminiExtractions}/${GEMINI_DAILY_EXTRACTION_LIMIT}`
        : `В очереди: ${candidates.length}`,
    );

    let queued = 0;
    let failed = 0;

    for (const entry of processableCandidates) {
      try {
        await updateLocalEntry(entry.id, {
          sync_status: "pending_reextract",
        });

        await enqueueQueueJob({
          type: "entry.reprocess_signal",
          payload: {
            entry_id: entry.id,
            server_id: entry.serverId ?? null,
            source_text_hash: entry.sourceTextHash,
          },
          priority: 10,
          entity_kind: "entry",
          entity_id: entry.id,
          idempotency_key: createReprocessJobIdempotencyKey(entry),
        });

        queued += 1;
        setReprocessMessage(`В очереди: ${queued}/${processableCandidates.length}`);
      } catch (error) {
        failed += 1;
        console.error("[fallback:reprocess]", error);
      }
    }

    await callbacks.refreshEntries();
    await callbacks.refreshInsights();
    await callbacks.refreshObservationHistory();

    setReprocessStatus(failed > 0 ? "error" : "done");
    setReprocessMessage(
      [
        `поставлено в очередь: ${queued}`,
        skippedByGeminiLimit > 0
          ? `отложено из-за Gemini лимита: ${skippedByGeminiLimit}`
          : null,
        `ошибок: ${failed}`,
      ]
        .filter(Boolean)
        .join(", "),
    );
  }

  function resetAfterLocalDataClear() {
    setDebugMode(false);
    setPersonaTextEnabled(true);
    setReprocessStatus("idle");
    setReprocessMessage("");
  }

  return {
    debugMode,
    personaTextEnabled,
    extractionConfig,
    extractionSettings,
    extractionStatus,
    reprocessMessage,
    reprocessStatus,
    changeExtractionSettings,
    initializeExtractionSettings,
    refreshExtractionStatus,
    reprocessFallbackEntries,
    resetAfterLocalDataClear,
    toggleDebugMode,
    togglePersonaText,
  };
}

function createReprocessJobIdempotencyKey(entry: EntryView) {
  return `entry.reprocess_signal:entry:${entry.id}:${entry.sourceTextHash}`;
}
