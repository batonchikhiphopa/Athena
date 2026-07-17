import type {
  ConfidenceLevel,
  MetricConfidence,
  MetricName,
  Signal,
  SignalAxis,
  SignalLevel,
  StateInference,
} from "../contracts/index.js";

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
};

const DEFAULT_METRIC_CONFIDENCE: MetricConfidence = {
  load: "low",
  fatigue: "low",
  focus: "low",
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

export function mapSignalCandidate(candidate: SignalCandidate): Signal {
  const load = mapMetric("load", candidate.state_inference);
  const fatigue = mapMetric("fatigue", candidate.state_inference);
  const focus = mapMetric("focus", candidate.state_inference);
  const metric_confidence: MetricConfidence = {
    load: load.confidence,
    fatigue: fatigue.confidence,
    focus: focus.confidence,
  };
  const hasMetric = load.score !== null || fatigue.score !== null || focus.score !== null;
  const hasTextSignal =
    candidate.topics.length > 0 ||
    candidate.activities.length > 0 ||
    candidate.activity_contexts.length > 0 ||
    candidate.markers.length > 0 ||
    Object.keys(candidate.state_inference).length > 0;

  return {
    topics: candidate.topics,
    activities: candidate.activities,
    activity_contexts: candidate.activity_contexts,
    markers: candidate.markers,
    state_inference: candidate.state_inference,
    metric_confidence,
    entry_intent: candidate.entry_intent,
    structure_signal: candidate.structure_signal,
    temporal_context: candidate.temporal_context,
    quality_reason: getQualityReason(
      candidate.state_inference,
      hasMetric,
      hasTextSignal,
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
    };
  }

  const totalWeight = weightedAxes.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore =
    weightedAxes.reduce((sum, item) => sum + item.score * item.weight, 0) /
    totalWeight;
  const baseScore = clampScore(Math.round(weightedScore));
  const baseConfidence = highestConfidence(weightedAxes.map((item) => item.confidence));

  return {
    score: baseScore,
    confidence: baseConfidence,
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

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, score));
}

function getQualityReason(
  stateInference: StateInference,
  hasMetric: boolean,
  hasTextSignal: boolean,
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

    return reason;
  }

  if (hasTextSignal) return "text_context_only";

  return "no_relevant_signal";
}
