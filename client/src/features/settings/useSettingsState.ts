import { useCallback, useState } from "react";
import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../../types";
import { appendEntrySignal, loadExtractionConfig, loadExtractionStatus } from "../../lib/api";
import { extractSignalForText } from "../../lib/extraction";
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

    let processed = 0;
    let recovered = 0;
    let failed = 0;
    let skippedFallback = 0;

    for (const entry of processableCandidates) {
      try {
        const extraction = await extractSignalForText(
          entry.text,
          extractionSettings,
        );

        if (extraction.signal.signal_quality === "fallback") {
          skippedFallback += 1;

          if (
            ["gemini_daily_limit", "quota_error"].includes(
              extraction.metadata.error_code ?? "",
            )
          ) {
            break;
          }

          setReprocessMessage(
            `Готово: ${processed + skippedFallback}/${processableCandidates.length}`,
          );
          continue;
        }

        if (entry.serverId) {
          const serverEntry = await appendEntrySignal(entry.serverId, {
            source_text_hash: entry.sourceTextHash,
            signal: extraction.signal,
            metadata: extraction.metadata,
          });

          await updateLocalEntry(entry.id, {
            serverId: serverEntry.id,
            signals: serverEntry.signal ?? extraction.signal,
            metadata: serverEntry.metadata ?? extraction.metadata,
            sync_status: "synced",
            updatedAt: serverEntry.updated_at,
          });
        } else {
          await updateLocalEntry(entry.id, {
            signals: extraction.signal,
            metadata: extraction.metadata,
            sync_status: "local_only",
          });
        }

        processed += 1;
        recovered += 1;
        setReprocessMessage(`Готово: ${processed}/${processableCandidates.length}`);
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
        `Обработано: ${processed}`,
        `восстановлено: ${recovered}`,
        `fallback пропущено: ${skippedFallback}`,
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
