import { type z } from "zod";
import {
  extractedSignalCandidateSchema,
  fallbackSignalSchema,
} from "../core/signal.schema.js";
import type { Signal } from "../core/types.js";

type ExtractedSignalCandidate = z.infer<typeof extractedSignalCandidateSchema>;

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

  const classified = classifySanitizedCandidate(result.data);

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

function classifySanitizedCandidate(candidate: ExtractedSignalCandidate): Signal {
  const hasTextSignal =
    candidate.topics.length > 0 ||
    candidate.activities.length > 0 ||
    candidate.markers.length > 0;

  const hasScoreSignal =
    candidate.load !== null ||
    candidate.fatigue !== null ||
    candidate.focus !== null;

  if (!hasTextSignal && !hasScoreSignal) {
    return {
      ...candidate,
      signal_quality: "fallback",
    };
  }

  if (!hasScoreSignal) {
    return {
      ...candidate,
      signal_quality: "sparse",
    };
  }

  return {
    ...candidate,
    signal_quality: "valid",
  };
}

export function createFallbackSignal(): Signal {
  const fallback = {
    topics: [],
    activities: [],
    markers: [],
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
