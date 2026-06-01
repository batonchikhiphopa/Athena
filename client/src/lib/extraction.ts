import type { ExtractionSettings } from "../types";
import { extractSignal } from "./api";
import { createFallbackMetadata, createFallbackSignal } from "./signals";
import {
  getLocalEmotionSpikeEnabled,
  reserveGeminiDailyExtraction,
} from "./storage";
import {
  extractLocalEmotionSignals,
  mergeLocalEmotionSignals,
} from "../features/emotion/localEmotion";

export async function extractSignalForText(
  rawText: string,
  settings: ExtractionSettings,
) {
  const emotionResult = getLocalEmotionSpikeEnabled()
    ? await extractLocalEmotionSignals(rawText)
    : null;

  if (settings.provider === "gemini" && !reserveGeminiDailyExtraction()) {
    return mergeEmotionIfAvailable({
      signal: createFallbackSignal(),
      metadata: createFallbackMetadata(
        settings.provider,
        settings.model,
        "gemini_daily_limit",
      ),
    }, emotionResult);
  }

  try {
    return mergeEmotionIfAvailable(
      await extractSignal({ text: rawText, settings }),
      emotionResult,
    );
  } catch (error) {
    console.warn("[client-extraction] using fallback:", error);

    return mergeEmotionIfAvailable({
      signal: createFallbackSignal(),
      metadata: createFallbackMetadata(
        settings.provider,
        settings.model,
        "backend_unavailable",
      ),
    }, emotionResult);
  }
}

function mergeEmotionIfAvailable(
  extraction: Awaited<ReturnType<typeof extractSignal>>,
  emotionResult: Awaited<ReturnType<typeof extractLocalEmotionSignals>> | null,
) {
  if (!emotionResult) return extraction;
  return mergeLocalEmotionSignals(extraction, emotionResult);
}
