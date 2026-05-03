import type { ExtractionSettings } from "../types";
import { extractSignal } from "./api";
import { createFallbackMetadata, createFallbackSignal } from "./signals";
import { reserveGeminiDailyExtraction } from "./storage";

export async function extractSignalForText(
  rawText: string,
  settings: ExtractionSettings,
) {
  if (settings.provider === "gemini" && !reserveGeminiDailyExtraction()) {
    return {
      signal: createFallbackSignal(),
      metadata: createFallbackMetadata(
        settings.provider,
        settings.model,
        "gemini_daily_limit",
      ),
    };
  }

  try {
    return await extractSignal({ text: rawText, settings });
  } catch (error) {
    console.warn("[client-extraction] using fallback:", error);

    return {
      signal: createFallbackSignal(),
      metadata: createFallbackMetadata(
        settings.provider,
        settings.model,
        "backend_unavailable",
      ),
    };
  }
}
