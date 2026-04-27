import type { ExtractionSettings } from "../types";
import { extractSignal } from "./api";
import { createFallbackMetadata, createFallbackSignal } from "./signals";

export async function extractSignalForText(
  rawText: string,
  settings: ExtractionSettings,
) {
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
