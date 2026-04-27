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
  getDebugMode,
  getExtractionSettings,
  setDebugMode as persistDebugMode,
  setExtractionSettings as persistExtractionSettings,
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

  async function reprocessFallbackEntries(
    entries: EntryView[],
    callbacks: ReprocessCallbacks,
  ) {
    const candidates = entries.filter(
      (entry) => entry.signals.signal_quality === "fallback" && entry.text,
    );

    setReprocessStatus("running");
    setReprocessMessage(`В очереди: ${candidates.length}`);

    let processed = 0;
    let recovered = 0;
    let failed = 0;

    for (const entry of candidates) {
      try {
        const extraction = await extractSignalForText(
          entry.text,
          extractionSettings,
        );

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
        if (extraction.signal.signal_quality !== "fallback") recovered += 1;
        setReprocessMessage(`Готово: ${processed}/${candidates.length}`);
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
      `Обработано: ${processed}, восстановлено: ${recovered}, ошибок: ${failed}`,
    );
  }

  function resetAfterLocalDataClear() {
    setDebugMode(false);
    setReprocessStatus("idle");
    setReprocessMessage("");
  }

  return {
    debugMode,
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
  };
}
