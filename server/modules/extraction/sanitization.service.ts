import {
  clientFallbackSignalSchema,
  extractedSignalCandidateSchema,
  fallbackSignalSchema,
} from "./signal.schema.js";
import {
  createEmptyMetricConfidence,
  mapSignalCandidate,
} from "../../../shared/signal/signalMapper.js";
import type { Signal } from "../../core/types.js";
import { createDefaultSignalContext } from "../../../shared/contracts/signalAnalysis.js";

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
  const context = createDefaultSignalContext();
  const fallback = {
    topics: [],
    activities: [],
    markers: [],
    state_inference: {},
    emotion_signals: {},
    metric_confidence: createEmptyMetricConfidence(),
    entry_intent: context.entry_intent,
    structure_signal: context.structure_signal,
    temporal_context: context.temporal_context,
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
