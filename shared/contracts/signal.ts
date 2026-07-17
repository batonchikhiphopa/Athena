export type ExtractionProvider = "ollama" | "gemini" | "off";

export type SignalQuality = "valid" | "sparse" | "fallback";
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const SIGNAL_LEVELS = CONFIDENCE_LEVELS;
export type SignalLevel = (typeof SIGNAL_LEVELS)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type EntryIntent =
  | "log"
  | "reflection"
  | "planning"
  | "decision"
  | "gratitude"
  | "venting"
  | "unknown";
export type StructureDensity = "empty" | "sparse" | "normal" | "dense";
export type TemporalBucket =
  | "morning"
  | "day"
  | "evening"
  | "night"
  | "unknown";
export type TemporalContextSource = "entry_metadata" | "created_at" | "absent";
export const SIGNAL_AXES = [
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
] as const;
export const METRIC_NAMES = ["load", "fatigue", "focus"] as const;
export type SignalAxis = (typeof SIGNAL_AXES)[number];
export type MetricName = (typeof METRIC_NAMES)[number];

export const ACTIVITY_CONTEXT_KINDS = [
  "task",
  "activity",
  "unknown",
] as const;
export const ACTIVITY_CONTEXT_EVENTS = [
  "planned",
  "started",
  "progressed",
  "maintained",
  "result",
  "blocked",
  "paused",
  "completed",
  "abandoned",
  "unknown",
] as const;
export const ACTIVITY_CONTEXT_OUTCOMES = [
  "achieved",
  "partial",
  "missed",
  "none",
  "unknown",
] as const;
export const ACTIVITY_CONTEXT_BLOCKERS = [
  "avoidance",
  "uncertainty",
  "overload",
  "external_dependency",
  "skill_gap",
  "time_pressure",
  "rejection",
  "health",
  "technical",
  "conflict",
] as const;
export const ACTIVITY_CONTEXT_STRATEGIES = [
  "clear_plan",
  "experiment",
  "adjusted",
  "repeated_attempt",
  "reactive",
  "no_plan",
  "unknown",
] as const;
export const ACTIVITY_CONTEXT_NEXT_STEPS = [
  "explicit",
  "vague",
  "not_mentioned",
] as const;
export const ACTIVITY_CONTEXT_AGENCIES = [
  "active",
  "mixed",
  "constrained",
  "passive",
  "unknown",
] as const;
export const ACTIVITY_CONTEXT_EFFECTS = [
  "draining",
  "restorative",
  "neutral",
  "mixed",
  "unclear",
] as const;

export type ActivityContextKind = (typeof ACTIVITY_CONTEXT_KINDS)[number];
export type ActivityContextEvent = (typeof ACTIVITY_CONTEXT_EVENTS)[number];
export type ActivityContextOutcome = (typeof ACTIVITY_CONTEXT_OUTCOMES)[number];
export type ActivityContextBlocker = (typeof ACTIVITY_CONTEXT_BLOCKERS)[number];
export type ActivityContextStrategy = (typeof ACTIVITY_CONTEXT_STRATEGIES)[number];
export type ActivityContextNextStep = (typeof ACTIVITY_CONTEXT_NEXT_STEPS)[number];
export type ActivityContextAgency = (typeof ACTIVITY_CONTEXT_AGENCIES)[number];
export type ActivityContextEffect = (typeof ACTIVITY_CONTEXT_EFFECTS)[number];

export type ActivityContext = {
  activity: string;
  kind: ActivityContextKind;
  event: ActivityContextEvent;
  outcome: ActivityContextOutcome;
  blockers: ActivityContextBlocker[];
  strategy: ActivityContextStrategy;
  next_step: ActivityContextNextStep;
  agency: ActivityContextAgency;
  effect: ActivityContextEffect;
  confidence: ConfidenceLevel;
};

export type StateInferenceValue = {
  level: SignalLevel;
  confidence: ConfidenceLevel;
  basis: string[];
};

export type StateInference = Partial<Record<SignalAxis, StateInferenceValue>>;

export type MetricConfidence = Record<MetricName, ConfidenceLevel>;

export type EntryIntentSignal = {
  intent: EntryIntent;
  confidence: ConfidenceLevel;
  basis: string[];
};

export type StructureSignal = {
  density: StructureDensity;
  coherence: ConfidenceLevel;
  has_question: boolean;
  has_plan: boolean;
  basis: string[];
};

export type TemporalContext = {
  local_date: string | null;
  time_bucket: TemporalBucket;
  source: TemporalContextSource;
};

export type Signal = {
  topics: string[];
  activities: string[];
  activity_contexts: ActivityContext[];
  markers: string[];
  state_inference: StateInference;
  metric_confidence: MetricConfidence;
  entry_intent: EntryIntentSignal;
  structure_signal: StructureSignal;
  temporal_context: TemporalContext;
  quality_reason: string;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  signal_quality: SignalQuality;
};

export type SignalMetadata = {
  schema_version: string;
  prompt_version: string;
  provider: ExtractionProvider;
  model: string;
  error_code?: string | null;
  created_at?: string;
};

export type ExtractionResult = {
  signal: Signal;
  metadata: SignalMetadata;
};
