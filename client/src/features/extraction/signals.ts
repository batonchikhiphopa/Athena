import {
  ACTIVITY_CONTEXT_AGENCIES as ACTIVITY_CONTEXT_AGENCY_VALUES,
  ACTIVITY_CONTEXT_BLOCKERS as ACTIVITY_CONTEXT_BLOCKER_VALUES,
  ACTIVITY_CONTEXT_EFFECTS as ACTIVITY_CONTEXT_EFFECT_VALUES,
  ACTIVITY_CONTEXT_EVENTS as ACTIVITY_CONTEXT_EVENT_VALUES,
  ACTIVITY_CONTEXT_KINDS as ACTIVITY_CONTEXT_KIND_VALUES,
  ACTIVITY_CONTEXT_NEXT_STEPS as ACTIVITY_CONTEXT_NEXT_STEP_VALUES,
  ACTIVITY_CONTEXT_OUTCOMES as ACTIVITY_CONTEXT_OUTCOME_VALUES,
  ACTIVITY_CONTEXT_STRATEGIES as ACTIVITY_CONTEXT_STRATEGY_VALUES,
  CONFIDENCE_LEVELS,
  SIGNAL_AXES as SIGNAL_AXIS_VALUES,
  type ActivityContext,
  type ExtractionProvider,
  type MetricConfidence,
  type Signal,
  type SignalAxis,
  type StateInference,
  type StateInferenceValue,
} from "../../shared/contracts";
/*
 * Runtime contract values above are shared with the server schema and provider
 * prompt. Keep normalization as a consumer of that contract, not a second
 * vocabulary definition.
 */
import { createDefaultSignalContext } from "../../../../shared/contracts/signalAnalysis.js";
import {
  createEmptyMetricConfidence,
  mapSignalCandidate,
} from "../../../../shared/signal/signalMapper.js";
import {
  CLIENT_ACTIVE_PROMPT_VERSION,
  CLIENT_ACTIVE_SCHEMA_VERSION,
} from "./signalVersions";

export { createEmptyMetricConfidence, mapSignalCandidate };

export const SIGNAL_AXES: readonly SignalAxis[] = SIGNAL_AXIS_VALUES;

const SIGNAL_AXIS_SET = new Set<string>(SIGNAL_AXES);
const LEVELS = new Set<string>(CONFIDENCE_LEVELS);
const ACTIVITY_CONTEXT_KINDS = new Set<string>(ACTIVITY_CONTEXT_KIND_VALUES);
const ACTIVITY_CONTEXT_EVENTS = new Set<string>(ACTIVITY_CONTEXT_EVENT_VALUES);
const ACTIVITY_CONTEXT_OUTCOMES = new Set<string>(
  ACTIVITY_CONTEXT_OUTCOME_VALUES,
);
const ACTIVITY_CONTEXT_BLOCKERS = new Set<string>(
  ACTIVITY_CONTEXT_BLOCKER_VALUES,
);
const ACTIVITY_CONTEXT_STRATEGIES = new Set<string>(
  ACTIVITY_CONTEXT_STRATEGY_VALUES,
);
const ACTIVITY_CONTEXT_NEXT_STEPS = new Set<string>(
  ACTIVITY_CONTEXT_NEXT_STEP_VALUES,
);
const ACTIVITY_CONTEXT_AGENCIES = new Set<string>(
  ACTIVITY_CONTEXT_AGENCY_VALUES,
);
const ACTIVITY_CONTEXT_EFFECTS = new Set<string>(
  ACTIVITY_CONTEXT_EFFECT_VALUES,
);

export function createFallbackSignal(): Signal {
  const context = createDefaultSignalContext();

  return {
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
  };
}

export function createFallbackMetadata(
  provider: ExtractionProvider = "off",
  model = "fallback",
  errorCode = "client_fallback",
) {
  return {
    schema_version: CLIENT_ACTIVE_SCHEMA_VERSION,
    prompt_version: CLIENT_ACTIVE_PROMPT_VERSION,
    provider,
    model,
    error_code: errorCode,
    created_at: new Date().toISOString(),
  };
}

export function normalizeSignal(value: unknown): Signal {
  return isCurrentSignal(value) ? value : createFallbackSignal();
}

export function isCurrentSignal(value: unknown): value is Signal {
  return (
    isRecord(value) &&
    isBoundedStringArray(value.topics, 5) &&
    isBoundedStringArray(value.activities, 5) &&
    isNormalizedActivityContexts(value.activity_contexts) &&
    isBoundedStringArray(value.markers, 8) &&
    isNormalizedStateInference(value.state_inference) &&
    isNormalizedMetricConfidence(value.metric_confidence) &&
    isNormalizedEntryIntent(value.entry_intent) &&
    isNormalizedStructureSignal(value.structure_signal) &&
    isNormalizedTemporalContext(value.temporal_context) &&
    typeof value.quality_reason === "string" &&
    value.quality_reason.trim().length > 0 &&
    isNormalizedScore(value.load) &&
    isNormalizedScore(value.fatigue) &&
    isNormalizedScore(value.focus) &&
    (value.signal_quality === "valid" ||
      value.signal_quality === "sparse" ||
      value.signal_quality === "fallback")
  );
}

function isNormalizedActivityContexts(
  value: unknown,
): value is ActivityContext[] {
  return (
    Array.isArray(value) &&
    value.length <= 2 &&
    value.every(
      (context) =>
        isRecord(context) &&
        typeof context.activity === "string" &&
        context.activity.trim().length > 0 &&
        context.activity.length <= 52 &&
        ACTIVITY_CONTEXT_KINDS.has(String(context.kind)) &&
        ACTIVITY_CONTEXT_EVENTS.has(String(context.event)) &&
        ACTIVITY_CONTEXT_OUTCOMES.has(String(context.outcome)) &&
        Array.isArray(context.blockers) &&
        context.blockers.length <= 2 &&
        context.blockers.every(
          (blocker) =>
            typeof blocker === "string" &&
            ACTIVITY_CONTEXT_BLOCKERS.has(blocker),
        ) &&
        ACTIVITY_CONTEXT_STRATEGIES.has(String(context.strategy)) &&
        ACTIVITY_CONTEXT_NEXT_STEPS.has(String(context.next_step)) &&
        ACTIVITY_CONTEXT_AGENCIES.has(String(context.agency)) &&
        ACTIVITY_CONTEXT_EFFECTS.has(String(context.effect)) &&
        LEVELS.has(String(context.confidence)),
    )
  );
}

function isBoundedStringArray(value: unknown, maxLength: number) {
  return (
    Array.isArray(value) &&
    value.length <= maxLength &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isNormalizedStateInference(value: unknown): value is StateInference {
  if (!isRecord(value)) return false;

  return Object.entries(value).every(
    ([axis, inference]) =>
      SIGNAL_AXIS_SET.has(axis) && isNormalizedStateInferenceValue(inference),
  );
}

function isNormalizedStateInferenceValue(
  value: unknown,
): value is StateInferenceValue {
  return (
    isRecord(value) &&
    LEVELS.has(String(value.level)) &&
    LEVELS.has(String(value.confidence)) &&
    isBoundedStringArray(value.basis, 6)
  );
}

function isNormalizedMetricConfidence(
  value: unknown,
): value is MetricConfidence {
  return (
    isRecord(value) &&
    LEVELS.has(String(value.load)) &&
    LEVELS.has(String(value.fatigue)) &&
    LEVELS.has(String(value.focus))
  );
}

function isNormalizedEntryIntent(value: unknown): value is Signal["entry_intent"] {
  return (
    isRecord(value) &&
    (value.intent === "log" ||
      value.intent === "reflection" ||
      value.intent === "planning" ||
      value.intent === "decision" ||
      value.intent === "gratitude" ||
      value.intent === "venting" ||
      value.intent === "unknown") &&
    LEVELS.has(String(value.confidence)) &&
    isBoundedStringArray(value.basis, 6)
  );
}

function isNormalizedStructureSignal(
  value: unknown,
): value is Signal["structure_signal"] {
  return (
    isRecord(value) &&
    (value.density === "empty" ||
      value.density === "sparse" ||
      value.density === "normal" ||
      value.density === "dense") &&
    LEVELS.has(String(value.coherence)) &&
    typeof value.has_question === "boolean" &&
    typeof value.has_plan === "boolean" &&
    isBoundedStringArray(value.basis, 6)
  );
}

function isNormalizedTemporalContext(
  value: unknown,
): value is Signal["temporal_context"] {
  return (
    isRecord(value) &&
    (value.local_date === null ||
      (typeof value.local_date === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value.local_date))) &&
    (value.time_bucket === "morning" ||
      value.time_bucket === "day" ||
      value.time_bucket === "evening" ||
      value.time_bucket === "night" ||
      value.time_bucket === "unknown") &&
    (value.source === "entry_metadata" ||
      value.source === "created_at" ||
      value.source === "absent")
  );
}

function isNormalizedScore(value: unknown): value is number | null {
  return (
    value === null ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 10)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
