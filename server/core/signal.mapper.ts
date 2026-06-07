import type {
  ConfidenceLevel,
  MetricConfidence,
  MetricName,
  Signal,
  SignalAxis,
  SignalLevel,
  StateInference,
} from "./types.js";
import { createDefaultSignalContext } from "../../shared/contracts/signalAnalysis.js";

type SignalCandidate = Omit<
  Signal,
  "load" | "fatigue" | "focus" | "metric_confidence" | "quality_reason" | "signal_quality"
> &
  Pick<Signal, "load" | "fatigue" | "focus" | "metric_confidence" | "quality_reason" | "signal_quality">;

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

const DEFAULT_METRIC_CONFIDENCE: MetricConfidence = {
  load: "low",
  fatigue: "low",
  focus: "low",
};

const EMOTION_ADJUSTMENT_THRESHOLD = 0.55;

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

export function mapSignalCandidate(candidate: SignalCandidate): Signal {
  const context = createDefaultSignalContext();
  const emotionLabels = extractEmotionLabels(candidate.emotion_signals);
  const load = mapMetric("load", candidate.state_inference, emotionLabels);
  const fatigue = mapMetric("fatigue", candidate.state_inference, emotionLabels);
  const focus = mapMetric("focus", candidate.state_inference, emotionLabels);
  const metric_confidence: MetricConfidence = {
    load: load.confidence,
    fatigue: fatigue.confidence,
    focus: focus.confidence,
  };
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
    metric_confidence,
    entry_intent: candidate.entry_intent ?? context.entry_intent,
    structure_signal: candidate.structure_signal ?? context.structure_signal,
    temporal_context: candidate.temporal_context ?? context.temporal_context,
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

export function createEmptyMetricConfidence(): MetricConfidence {
  return { ...DEFAULT_METRIC_CONFIDENCE };
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
  const forwardScore =
    level === "high" ? 8 : level === "medium" ? 5 : 2;

  return direction === 1 ? forwardScore : 10 - forwardScore;
}

function confidenceWeight(confidence: ConfidenceLevel): number {
  if (confidence === "high") return 1.15;
  if (confidence === "medium") return 1;
  return 0.8;
}

function highestConfidence(confidences: ConfidenceLevel[]): ConfidenceLevel {
  return confidences.reduce<ConfidenceLevel>((best, confidence) =>
    CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK[best] ? confidence : best,
  "low");
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
