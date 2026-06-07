import type { ExtractionSettings } from "../types";
import type { LocalEmotionResult } from "../features/emotion/localEmotion";
import { extractSignal } from "./api";
import { createFallbackMetadata, createFallbackSignal } from "./signals";
import {
  analyzeSignalContext,
  type SignalContextInput,
} from "../../../shared/contracts/signalAnalysis.js";
import {
  getLocalEmotionSpikeEnabled,
  reserveGeminiDailyExtraction,
} from "./storage";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY } from "../i18n/languages";

export async function extractSignalForText(
  rawText: string,
  settings: ExtractionSettings,
  context: SignalContextInput = {},
  signal?: AbortSignal,
) {
  if (signal?.aborted) {
    throw new Error("Job was cancelled.");
  }

  const emotionModule = await loadLocalEmotionModuleIfAllowed();
  const emotionResult = emotionModule
    ? await emotionModule.extractLocalEmotionSignals(rawText)
    : null;

  if (signal?.aborted) {
    throw new Error("Job was cancelled.");
  }

  if (settings.provider === "gemini" && !reserveGeminiDailyExtraction()) {
    return mergeEmotionIfAvailable(
      withSignalContext({
        signal: createFallbackSignal(),
        metadata: createFallbackMetadata(
          settings.provider,
          settings.model,
          "gemini_daily_limit",
        ),
      }, rawText, context),
      emotionResult,
      emotionModule?.mergeLocalEmotionSignals,
    );
  }

  try {
    return mergeEmotionIfAvailable(
      withSignalContext(
        await extractSignal({
          text: rawText,
          settings,
          entryDate: context.entryDate ?? undefined,
          capturedAt: context.capturedAt ?? undefined,
          signal,
        }),
        rawText,
        context,
      ),
      emotionResult,
      emotionModule?.mergeLocalEmotionSignals,
    );
  } catch (error) {
    console.warn("[client-extraction] using fallback:", error);

    return mergeEmotionIfAvailable(
      withSignalContext({
        signal: createFallbackSignal(),
        metadata: createFallbackMetadata(
          settings.provider,
          settings.model,
          "backend_unavailable",
        ),
      }, rawText, context),
      emotionResult,
      emotionModule?.mergeLocalEmotionSignals,
    );
  }
}

function withSignalContext(
  extraction: Awaited<ReturnType<typeof extractSignal>>,
  rawText: string,
  context: SignalContextInput,
) {
  return {
    ...extraction,
    signal: {
      ...extraction.signal,
      ...analyzeSignalContext(rawText, context),
    },
  };
}

function mergeEmotionIfAvailable(
  extraction: Awaited<ReturnType<typeof extractSignal>>,
  emotionResult: LocalEmotionResult | null,
  mergeLocalEmotionSignals?: (
    extraction: Awaited<ReturnType<typeof extractSignal>>,
    emotion: LocalEmotionResult,
  ) => Awaited<ReturnType<typeof extractSignal>>,
) {
  if (!emotionResult || !mergeLocalEmotionSignals) return extraction;
  return mergeLocalEmotionSignals(extraction, emotionResult);
}

async function loadLocalEmotionModuleIfAllowed() {
  if (!getLocalEmotionSpikeEnabled()) return null;
  if (getCurrentInterfaceLanguage() !== "ru") return null;

  return import("../features/emotion/localEmotion");
}

function getCurrentInterfaceLanguage() {
  if (typeof localStorage === "undefined") return DEFAULT_LANGUAGE;

  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
