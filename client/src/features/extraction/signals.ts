import type {
  ConfidenceLevel,
  ExtractionProvider,
  MetricConfidence,
  Signal,
  SignalAxis,
  SignalLevel,
  StateInference,
  StateInferenceValue,
} from "../../shared/contracts";
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

export const SIGNAL_AXES: SignalAxis[] = [
  "load",
  "fatigue",
  "focus",
  "distress",
  "anxiety",
  "mood",
  "energy",
  "sleep_quality",
  "self_attack",
  "shame_guilt",
  "rumination",
  "avoidance",
  "agency",
  "conflict",
  "social_connection",
  "recovery_need",
  "confidence",
];

const SIGNAL_AXIS_SET = new Set<string>(SIGNAL_AXES);
const LEVELS = new Set<string>(["low", "medium", "high"]);

export function createFallbackSignal(): Signal {
  const context = createDefaultSignalContext();

  return {
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
  if (!isRecord(value)) return createFallbackSignal();
  if (isNormalizedSignal(value)) return value;

  const signalQuality =
    value.signal_quality === "valid" ||
    value.signal_quality === "sparse" ||
    value.signal_quality === "fallback"
      ? value.signal_quality
      : "fallback";

  return {
    topics: normalizeStringArray(value.topics).slice(0, 5),
    activities: normalizeStringArray(value.activities).slice(0, 5),
    markers: normalizeStringArray(value.markers).slice(0, 8),
    state_inference: normalizeStateInference(value.state_inference),
    emotion_signals: isRecord(value.emotion_signals) ? value.emotion_signals : {},
    metric_confidence: normalizeMetricConfidence(value.metric_confidence),
    entry_intent: normalizeEntryIntent(value.entry_intent),
    structure_signal: normalizeStructureSignal(value.structure_signal),
    temporal_context: normalizeTemporalContext(value.temporal_context),
    quality_reason:
      typeof value.quality_reason === "string" && value.quality_reason.trim()
        ? value.quality_reason
        : signalQuality === "fallback"
          ? "fallback"
          : "legacy_signal_v2",
    load: normalizeScore(value.load),
    fatigue: normalizeScore(value.fatigue),
    focus: normalizeScore(value.focus),
    signal_quality: signalQuality,
  };
}

function normalizeStateInference(value: unknown): StateInference {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce<StateInference>((result, [axis, raw]) => {
    const inference = normalizeStateInferenceValue(raw);
    if (!SIGNAL_AXIS_SET.has(axis) || !inference) return result;

    result[axis as SignalAxis] = inference;
    return result;
  }, {});
}

function normalizeStateInferenceValue(
  value: unknown,
): StateInferenceValue | null {
  if (!isRecord(value)) return null;
  if (!LEVELS.has(String(value.level))) return null;
  if (!LEVELS.has(String(value.confidence))) return null;

  return {
    level: value.level as SignalLevel,
    confidence: value.confidence as ConfidenceLevel,
    basis: normalizeStringArray(value.basis).slice(0, 6),
  };
}

function normalizeMetricConfidence(value: unknown): MetricConfidence {
  if (!isRecord(value)) return createEmptyMetricConfidence();

  return {
    load: normalizeConfidence(value.load),
    fatigue: normalizeConfidence(value.fatigue),
    focus: normalizeConfidence(value.focus),
  };
}

function normalizeEntryIntent(value: unknown): Signal["entry_intent"] {
  const fallback = createDefaultSignalContext().entry_intent;
  if (!isRecord(value)) return fallback;

  const intent =
    value.intent === "log" ||
    value.intent === "reflection" ||
    value.intent === "planning" ||
    value.intent === "decision" ||
    value.intent === "gratitude" ||
    value.intent === "venting" ||
    value.intent === "unknown"
      ? value.intent
      : fallback.intent;

  return {
    intent,
    confidence: normalizeConfidence(value.confidence),
    basis: normalizeStringArray(value.basis).slice(0, 6),
  };
}

function normalizeStructureSignal(value: unknown): Signal["structure_signal"] {
  const fallback = createDefaultSignalContext().structure_signal;
  if (!isRecord(value)) return fallback;

  const density =
    value.density === "empty" ||
    value.density === "sparse" ||
    value.density === "normal" ||
    value.density === "dense"
      ? value.density
      : fallback.density;

  return {
    density,
    coherence: normalizeConfidence(value.coherence),
    has_question: value.has_question === true,
    has_plan: value.has_plan === true,
    basis: normalizeStringArray(value.basis).slice(0, 6),
  };
}

function normalizeTemporalContext(value: unknown): Signal["temporal_context"] {
  const fallback = createDefaultSignalContext().temporal_context;
  if (!isRecord(value)) return fallback;

  const timeBucket =
    value.time_bucket === "morning" ||
    value.time_bucket === "day" ||
    value.time_bucket === "evening" ||
    value.time_bucket === "night" ||
    value.time_bucket === "unknown"
      ? value.time_bucket
      : fallback.time_bucket;
  const source =
    value.source === "entry_metadata" ||
    value.source === "created_at" ||
    value.source === "absent"
      ? value.source
      : fallback.source;
  const localDate =
    typeof value.local_date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.local_date)
      ? value.local_date
      : null;

  return {
    local_date: localDate,
    time_bucket: timeBucket,
    source,
  };
}

function normalizeConfidence(value: unknown): ConfidenceLevel {
  return LEVELS.has(String(value)) ? (value as ConfidenceLevel) : "low";
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
    : [];
}

function normalizeScore(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 10
    ? value
    : null;
}

function isNormalizedSignal(value: Record<string, unknown>): value is Signal {
  return (
    isBoundedStringArray(value.topics, 5) &&
    isBoundedStringArray(value.activities, 5) &&
    isBoundedStringArray(value.markers, 8) &&
    isNormalizedStateInference(value.state_inference) &&
    isRecord(value.emotion_signals) &&
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
