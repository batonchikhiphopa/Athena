import {
  clientFallbackSignalSchema,
  extractedSignalCandidateSchema,
  fallbackSignalSchema,
} from "../core/signal.schema.js";
import { createEmptyMetricConfidence, mapSignalCandidate } from "../core/signal.mapper.js";
import type { Signal } from "../core/types.js";

type SanitizedSignalResult =
  | {
      ok: true;
      data: Signal;
    }
  | {
      ok: false;
      error: Error;
    };

export function sanitizeSignalCandidate(
  candidate: unknown,
): SanitizedSignalResult {
  const result = extractedSignalCandidateSchema.safeParse(candidate);

  if (!result.success) {
    return {
      ok: false,
      error: result.error,
    };
  }

  const classified = mapSignalCandidate(result.data);

  if (classified.signal_quality === "fallback") {
    return {
      ok: false,
      error: new Error("Structurally empty signal"),
    };
  }

  return {
    ok: true,
    data: classified,
  };
}

export function createFallbackSignal(): Signal {
  const fallback = {
    topics: [],
    activities: [],
    markers: [],
    state_inference: {},
    emotion_signals: {},
    metric_confidence: createEmptyMetricConfidence(),
    quality_reason: "fallback",
    load: null,
    fatigue: null,
    focus: null,
    signal_quality: "fallback",
  } satisfies Signal;

  const result = fallbackSignalSchema.safeParse({
    ...fallback,
    entry_id: 1,
    source_text_hash: "tmp",
    schema_version: "tmp",
    prompt_version: "tmp",
    model: "tmp",
    created_at: new Date().toISOString(),
  });

  if (!result.success) {
    throw new Error("Fallback schema mismatch");
  }

  return fallback;
}

export function isClientFallbackSignal(value: unknown): boolean {
  return clientFallbackSignalSchema.safeParse(value).success;
}
