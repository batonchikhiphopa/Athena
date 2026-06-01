import { useCallback, useState } from "react";
import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../../types";
import { loadExtractionConfig, loadExtractionStatus } from "../../lib/api";
import {
  GEMINI_DAILY_EXTRACTION_LIMIT,
  getDebugMode,
  getExtractionSettings,
  getLocalEmotionSpikeEnabled,
  getRemainingGeminiDailyExtractions,
  getPersonaTextEnabled,
  setDebugMode as persistDebugMode,
  setExtractionSettings as persistExtractionSettings,
  setLocalEmotionSpikeEnabled as persistLocalEmotionSpikeEnabled,
  setPersonaTextEnabled as persistPersonaTextEnabled,
  updateLocalEntry,
} from "../../lib/storage";
import {
  extractLocalEmotionSignals,
  type LocalEmotionResult,
} from "../emotion/localEmotion";
import { enqueueEntrySignalReprocessJob } from "../sync/entryReprocessJob";
import {
  getSignalReprocessReason,
  isSignalReprocessCandidate,
} from "../sync/reprocessPolicy";
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
  const [localEmotionSpikeEnabled, setLocalEmotionSpikeEnabled] = useState(() =>
    getLocalEmotionSpikeEnabled(),
  );
  const [localEmotionSpikeStatus, setLocalEmotionSpikeStatus] =
    useState<"idle" | "running" | "done" | "error">("idle");
  const [localEmotionSpikeResult, setLocalEmotionSpikeResult] =
    useState<LocalEmotionResult | null>(null);
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

  function toggleLocalEmotionSpike(nextValue: boolean) {
    setLocalEmotionSpikeEnabled(nextValue);
    persistLocalEmotionSpikeEnabled(nextValue);
  }

  function togglePersonaText(nextValue: boolean) {
    setPersonaTextEnabled(nextValue);
    persistPersonaTextEnabled(nextValue);
  }

  async function runLocalEmotionSpikeDemo() {
    setLocalEmotionSpikeStatus("running");

    const result = await extractLocalEmotionSignals(
      "Сегодня тревожно, но я всё равно рад, что удалось спокойно закончить важную работу.",
    );

    setLocalEmotionSpikeResult(result);
    setLocalEmotionSpikeStatus(result.ok ? "done" : "error");
  }

  async function reprocessFallbackEntries(
    entries: EntryView[],
    callbacks: ReprocessCallbacks,
  ) {
    const candidates = entries.filter(
      (entry) =>
        entry.analysisEnabled &&
        isSignalReprocessCandidate(entry.signals, entry.metadata) &&
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
        ? `Подготовлено к повторному анализу: ${processableCandidates.length}/${candidates.length}. Осталось попыток Gemini сегодня: ${remainingGeminiExtractions}/${GEMINI_DAILY_EXTRACTION_LIMIT}`
        : `Подготовлено к повторному анализу: ${candidates.length}`,
    );

    let queued = 0;
    let failed = 0;

    for (const entry of processableCandidates) {
      try {
        await updateLocalEntry(entry.id, {
          sync_status: "pending_reextract",
        });

        await enqueueEntrySignalReprocessJob({
          entryId: entry.id,
          serverId: entry.serverId,
          sourceTextHash: entry.sourceTextHash,
          reason: getSignalReprocessReason(entry.signals, entry.metadata),
        });

        queued += 1;
        setReprocessMessage(
          `Подготовлено: ${queued} из ${processableCandidates.length}`,
        );
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
        `Подготовлено к обработке: ${queued}`,
        skippedByGeminiLimit > 0
          ? `Отложено до следующего лимита Gemini: ${skippedByGeminiLimit}`
          : null,
        `Не удалось подготовить: ${failed}`,
      ]
        .filter(Boolean)
        .join(", "),
    );
  }

  function resetAfterLocalDataClear() {
    setDebugMode(false);
    setLocalEmotionSpikeEnabled(false);
    setLocalEmotionSpikeResult(null);
    setLocalEmotionSpikeStatus("idle");
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
    localEmotionSpikeEnabled,
    localEmotionSpikeResult,
    localEmotionSpikeStatus,
    reprocessMessage,
    reprocessStatus,
    changeExtractionSettings,
    initializeExtractionSettings,
    refreshExtractionStatus,
    reprocessFallbackEntries,
    resetAfterLocalDataClear,
    runLocalEmotionSpikeDemo,
    toggleDebugMode,
    toggleLocalEmotionSpike,
    togglePersonaText,
  };
}
