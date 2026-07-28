import {
  clientFallbackSignalSchema,
  extractedSignalCandidateSchema,
  fallbackSignalSchema,
} from "./signal.schema.js";
import type { ZodIssue } from "zod";
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
      reason: string;
    };

export function sanitizeSignalCandidate(
  candidate: unknown,
): SanitizedSignalResult {
  const result = extractedSignalCandidateSchema.safeParse(candidate);

  if (!result.success) {
    return {
      ok: false,
      error: result.error,
      reason: formatSignalSchemaError(result.error.issues),
    };
  }

  const classified = mapSignalCandidate({
    ...result.data,
    activity_contexts: alignActivityContexts(
      result.data.activities,
      result.data.activity_contexts,
    ),
  });

  if (classified.signal_quality === "fallback") {
    return {
      ok: false,
      error: new Error("Structurally empty signal"),
      reason: "structurally_empty_signal",
    };
  }

  return {
    ok: true,
    data: classified,
  };
}

export function sanitizeProviderSignalCandidate(
  candidate: unknown,
  context: Pick<
    Signal,
    "entry_intent" | "structure_signal" | "temporal_context"
  >,
): SanitizedSignalResult {
  if (!isRecord(candidate)) {
    return sanitizeSignalCandidate(candidate);
  }

  return sanitizeSignalCandidate({
    ...candidate,
    ...context,
  });
}

export function createFallbackSignal(): Signal {
  const context = createDefaultSignalContext();
  const fallback = {
    topics: [],
    activities: [],
    activity_contexts: [],
    markers: [],
    state_inference: {},
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

function alignActivityContexts(
  activities: string[],
  contexts: Signal["activity_contexts"],
): Signal["activity_contexts"] {
  const activityByKey = new Map(
    activities.map((activity) => [normalizeActivityKey(activity), activity]),
  );
  const used = new Set<string>();

  return contexts.flatMap((context) => {
    const key = normalizeActivityKey(context.activity);
    const activity = activityByKey.get(key);
    if (!activity || used.has(key)) return [];

    used.add(key);
    return [{ ...context, activity }];
  });
}

function normalizeActivityKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function formatSignalSchemaError(issues: ZodIssue[]): string {
  const details = issues.slice(0, 8).map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "$";
    return `${issue.code}@${path}`;
  });
  const omitted = issues.length - details.length;
  const suffix = omitted > 0 ? `,+${omitted}_more` : "";

  return `signal_schema_error:${details.join(",")}${suffix}`.slice(0, 256);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
