export type ExtractionProvider = "ollama" | "gemini" | "off";

export type SignalQuality = "valid" | "sparse" | "fallback";
export type SignalLevel = "low" | "medium" | "high";
export type ConfidenceLevel = "low" | "medium" | "high";
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
export type SignalAxis =
  | "load"
  | "fatigue"
  | "focus"
  | "distress"
  | "anxiety"
  | "mood"
  | "energy"
  | "sleep_quality"
  | "self_attack"
  | "shame_guilt"
  | "rumination"
  | "avoidance"
  | "agency"
  | "conflict"
  | "social_connection"
  | "recovery_need"
  | "confidence";
export type MetricName = "load" | "fatigue" | "focus";

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
  markers: string[];
  state_inference: StateInference;
  emotion_signals: Record<string, unknown>;
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
