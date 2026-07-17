import type { ExtractionSettings } from "../../shared/contracts";
import { extractSignal } from "./extractionApi";
import { createFallbackMetadata, createFallbackSignal } from "./signals";
import {
  analyzeSignalContext,
  type SignalContextInput,
} from "../../../../shared/contracts/signalAnalysis.js";
import {
  releaseGeminiDailyExtraction,
  reserveGeminiDailyExtraction,
} from "./geminiQuota";

export async function extractSignalForText(
  rawText: string,
  settings: ExtractionSettings,
  context: SignalContextInput = {},
  signal?: AbortSignal,
) {
  if (signal?.aborted) {
    throw new Error("Job was cancelled.");
  }

  let hasGeminiReservation = false;
  const releaseGeminiReservation = () => {
    if (!hasGeminiReservation) return;

    releaseGeminiDailyExtraction();
    hasGeminiReservation = false;
  };

  if (settings.provider === "gemini" && !reserveGeminiDailyExtraction()) {
    return withSignalContext(
      {
        signal: createFallbackSignal(),
        metadata: createFallbackMetadata(
          settings.provider,
          settings.model,
          "gemini_daily_limit",
        ),
      },
      rawText,
      context,
    );
  }

  hasGeminiReservation = settings.provider === "gemini";

  try {
    const extraction = withSignalContext(
      await extractSignal({
        text: rawText,
        settings,
        entryDate: context.entryDate ?? undefined,
        capturedAt: context.capturedAt ?? undefined,
        signal,
      }),
      rawText,
      context,
    );

    if (hasExtractionError(extraction)) {
      releaseGeminiReservation();
    }

    return extraction;
  } catch (error) {
    releaseGeminiReservation();
    console.warn("[client-extraction] using fallback:", error);

    return withSignalContext(
      {
        signal: createFallbackSignal(),
        metadata: createFallbackMetadata(
          settings.provider,
          settings.model,
          "backend_unavailable",
        ),
      },
      rawText,
      context,
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

function hasExtractionError(
  extraction: Awaited<ReturnType<typeof extractSignal>>,
) {
  return Boolean(extraction.metadata.error_code);
}
