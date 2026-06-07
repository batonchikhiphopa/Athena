import type {
  ConfidenceLevel,
  ExtractionProvider,
  MetricConfidence,
  MetricName,
  Signal,
  SignalAxis,
  SignalLevel,
  StateInference,
  StateInferenceValue,
} from "../types";
import { createDefaultSignalContext } from "../../../shared/contracts/signalAnalysis.js";
import {
  CLIENT_ACTIVE_PROMPT_VERSION,
  CLIENT_ACTIVE_SCHEMA_VERSION,
} from "./signalVersions";

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

type WeightedAxis = {
  axis: SignalAxis;
  direction: 1 | -1;
  weight: number;
};

type MetricMapResult = {
  score: number | null;
  confidence: ConfidenceLevel;
  emotionAdjustment: EmotionMetricAdjustment | null;
};

type EmotionMetricAdjustment = {
  metric: MetricName;
  label: string;
  score: number;
  direction: 1 | -1;
};

const METRIC_AXES: Record<MetricName, WeightedAxis[]> = {
  load: [
    { axis: "load", direction: 1, weight: 1.35 },
    { axis: "distress", direction: 1, weight: 1.15 },
    { axis: "anxiety", direction: 1, weight: 1.05 },
    { axis: "self_attack", direction: 1, weight: 1.1 },
    { axis: "shame_guilt", direction: 1, weight: 0.85 },
    { axis: "rumination", direction: 1, weight: 0.95 },
    { axis: "avoidance", direction: 1, weight: 0.8 },
    { axis: "conflict", direction: 1, weight: 1.0 },
    { axis: "recovery_need", direction: 1, weight: 0.75 },
    { axis: "agency", direction: -1, weight: 0.45 },
  ],
  fatigue: [
    { axis: "fatigue", direction: 1, weight: 1.35 },
    { axis: "energy", direction: -1, weight: 1.15 },
    { axis: "sleep_quality", direction: -1, weight: 1.0 },
    { axis: "recovery_need", direction: 1, weight: 1.05 },
    { axis: "distress", direction: 1, weight: 0.55 },
    { axis: "load", direction: 1, weight: 0.45 },
  ],
  focus: [
    { axis: "focus", direction: 1, weight: 1.35 },
    { axis: "agency", direction: 1, weight: 1.05 },
    { axis: "energy", direction: 1, weight: 0.75 },
    { axis: "avoidance", direction: -1, weight: 1.05 },
    { axis: "rumination", direction: -1, weight: 0.95 },
    { axis: "distress", direction: -1, weight: 0.85 },
    { axis: "anxiety", direction: -1, weight: 0.7 },
    { axis: "self_attack", direction: -1, weight: 0.7 },
    { axis: "conflict", direction: -1, weight: 0.45 },
  ],
};

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

const EMOTION_ADJUSTMENT_THRESHOLD = 0.55;

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

export function createEmptyMetricConfidence(): MetricConfidence {
  return {
    load: "low",
    fatigue: "low",
    focus: "low",
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

export function mapSignalCandidate(candidate: Signal): Signal {
  const emotionLabels = extractEmotionLabels(candidate.emotion_signals);
  const load = mapMetric("load", candidate.state_inference, emotionLabels);
  const fatigue = mapMetric("fatigue", candidate.state_inference, emotionLabels);
  const focus = mapMetric("focus", candidate.state_inference, emotionLabels);
  const hasMetric = load.score !== null || fatigue.score !== null || focus.score !== null;
  const hasEmotionSignal = Object.keys(emotionLabels).length > 0;
  const hasTextSignal =
    candidate.topics.length > 0 ||
    candidate.activities.length > 0 ||
    candidate.markers.length > 0 ||
    Object.keys(candidate.state_inference).length > 0 ||
    Object.keys(candidate.emotion_signals).length > 0;

  return {
    topics: candidate.topics,
    activities: candidate.activities,
    markers: candidate.markers,
    state_inference: candidate.state_inference,
    emotion_signals: candidate.emotion_signals,
    metric_confidence: {
      load: load.confidence,
      fatigue: fatigue.confidence,
      focus: focus.confidence,
    },
    entry_intent: normalizeEntryIntent(candidate.entry_intent),
    structure_signal: normalizeStructureSignal(candidate.structure_signal),
    temporal_context: normalizeTemporalContext(candidate.temporal_context),
    quality_reason: getQualityReason(
      candidate.state_inference,
      hasMetric,
      hasTextSignal,
      hasEmotionSignal,
      [load, fatigue, focus],
    ),
    load: load.score,
    fatigue: fatigue.score,
    focus: focus.score,
    signal_quality: hasMetric ? "valid" : hasTextSignal ? "sparse" : "fallback",
  };
}

function mapMetric(
  metric: MetricName,
  stateInference: StateInference,
  emotionLabels: Record<string, number>,
): MetricMapResult {
  const weightedAxes = METRIC_AXES[metric]
    .map((config) => {
      const inference = stateInference[config.axis];
      if (!inference) return null;

      return {
        score: scoreLevel(inference.level, config.direction),
        confidence: inference.confidence,
        weight: config.weight * confidenceWeight(inference.confidence),
      };
    })
    .filter(
      (
        item,
      ): item is {
        score: number;
        confidence: ConfidenceLevel;
        weight: number;
      } => item !== null,
    );

  if (weightedAxes.length === 0) {
    return {
      score: null,
      confidence: "low",
      emotionAdjustment: null,
    };
  }

  const totalWeight = weightedAxes.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore =
    weightedAxes.reduce((sum, item) => sum + item.score * item.weight, 0) /
    totalWeight;
  const baseScore = clampScore(Math.round(weightedScore));
  const baseConfidence = highestConfidence(weightedAxes.map((item) => item.confidence));
  const emotionAdjustment = getEmotionMetricAdjustment(metric, emotionLabels);

  return {
    score: emotionAdjustment
      ? clampScore(baseScore + emotionAdjustment.direction)
      : baseScore,
    confidence: adjustConfidence(baseConfidence, emotionAdjustment),
    emotionAdjustment,
  };
}

function scoreLevel(level: SignalLevel, direction: 1 | -1): number {
  const forwardScore = level === "high" ? 8 : level === "medium" ? 5 : 2;

  return direction === 1 ? forwardScore : 10 - forwardScore;
}

function confidenceWeight(confidence: ConfidenceLevel): number {
  if (confidence === "high") return 1.15;
  if (confidence === "medium") return 1;
  return 0.8;
}

function highestConfidence(confidences: ConfidenceLevel[]): ConfidenceLevel {
  return confidences.reduce<ConfidenceLevel>(
    (best, confidence) =>
      CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK[best] ? confidence : best,
    "low",
  );
}

function adjustConfidence(
  confidence: ConfidenceLevel,
  emotionAdjustment: EmotionMetricAdjustment | null,
): ConfidenceLevel {
  if (!emotionAdjustment || confidence !== "low" || emotionAdjustment.score < 0.75) {
    return confidence;
  }

  return "medium";
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}

function getQualityReason(
  stateInference: StateInference,
  hasMetric: boolean,
  hasTextSignal: boolean,
  hasEmotionSignal: boolean,
  metrics: MetricMapResult[],
): string {
  const primaryAxis = Object.entries(stateInference)
    .sort((left, right) => {
      const leftConfidence = CONFIDENCE_RANK[left[1].confidence];
      const rightConfidence = CONFIDENCE_RANK[right[1].confidence];
      if (leftConfidence !== rightConfidence) return rightConfidence - leftConfidence;

      return left[0].localeCompare(right[0]);
    })[0];

  if (primaryAxis) {
    const reason = hasMetric
      ? `state_${primaryAxis[0]}_${primaryAxis[1].level}`
      : "state_without_metric_projection";

    return withEmotionReason(reason, metrics);
  }

  if (hasEmotionSignal) return "emotion_context_only";
  if (hasTextSignal) return "text_context_only";

  return "no_relevant_signal";
}

function withEmotionReason(reason: string, metrics: MetricMapResult[]): string {
  const adjustments = metrics
    .map((metric) => metric.emotionAdjustment)
    .filter((adjustment): adjustment is EmotionMetricAdjustment => adjustment !== null);

  if (adjustments.length === 0) return reason;

  const labels = [...new Set(adjustments.map((adjustment) => adjustment.label))]
    .slice(0, 2)
    .join("_");
  const metricNames = adjustments
    .map((adjustment) => adjustment.metric)
    .join("_");

  return `${reason}_emotion_${labels}_${metricNames}`.slice(0, 128);
}

function extractEmotionLabels(signals: Record<string, unknown>): Record<string, number> {
  const nestedLabels = isRecord(signals.labels) ? signals.labels : signals;

  return Object.entries(nestedLabels).reduce<Record<string, number>>(
    (result, [label, rawScore]) => {
      if (typeof rawScore !== "number" || !Number.isFinite(rawScore)) return result;

      const normalizedLabel = normalizeEmotionLabel(label);
      if (!normalizedLabel) return result;

      result[normalizedLabel] = Math.max(0, Math.min(1, rawScore));
      return result;
    },
    {},
  );
}

function getEmotionMetricAdjustment(
  metric: MetricName,
  labels: Record<string, number>,
): EmotionMetricAdjustment | null {
  const candidates = getEmotionAdjustmentCandidates(metric, labels)
    .filter((candidate) => candidate.score >= EMOTION_ADJUSTMENT_THRESHOLD)
    .sort((left, right) => right.score - left.score);

  return candidates[0] ?? null;
}

function getEmotionAdjustmentCandidates(
  metric: MetricName,
  labels: Record<string, number>,
): EmotionMetricAdjustment[] {
  if (metric === "load") {
    return [
      emotionCandidate(metric, "fear", labels, 1),
      emotionCandidate(metric, "anger", labels, 1),
      emotionCandidate(metric, "sadness", labels, 1),
      emotionCandidate(metric, "disgust", labels, 1),
      emotionCandidate(metric, "joy", labels, -1),
      emotionCandidate(metric, "happiness", labels, -1),
    ];
  }

  if (metric === "fatigue") {
    return [
      emotionCandidate(metric, "sadness", labels, 1),
      emotionCandidate(metric, "joy", labels, -1),
      emotionCandidate(metric, "happiness", labels, -1),
      emotionCandidate(metric, "excitement", labels, -1),
    ];
  }

  return [
    emotionCandidate(metric, "joy", labels, 1),
    emotionCandidate(metric, "happiness", labels, 1),
    emotionCandidate(metric, "excitement", labels, 1),
    emotionCandidate(metric, "fear", labels, -1),
    emotionCandidate(metric, "anger", labels, -1),
    emotionCandidate(metric, "sadness", labels, -1),
  ];
}

function emotionCandidate(
  metric: MetricName,
  label: string,
  labels: Record<string, number>,
  direction: 1 | -1,
): EmotionMetricAdjustment {
  return {
    metric,
    label,
    score: labels[label] ?? 0,
    direction,
  };
}

function normalizeEmotionLabel(label: string): string {
  return label
    .trim()
    .toLocaleLowerCase()
    .replace(/^label_/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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
