import type {
  EntryStatus,
  ExtractionProvider,
  ExtractionResult,
  InsightLayer,
  InsightSnapshot,
  SelfReportDailyAggregate,
  Signal,
  SignalMetadata,
  SignalQuality,
} from "../../shared/contracts/index.js";

export type {
  ConfidenceLevel,
  EntryStatus,
  EntryIntent,
  EntryIntentSignal,
  ExtractionProvider,
  ExtractionResult,
  InsightLayer,
  InsightSnapshot,
  MetricConfidence,
  MetricName,
  SelfReportAxis,
  SelfReportDailyAggregate,
  Signal,
  SignalAxis,
  SignalLevel,
  SignalMetadata,
  SignalQuality,
  StructureDensity,
  StructureSignal,
  TemporalBucket,
  TemporalContext,
  TemporalContextSource,
  StateInference,
  StateInferenceValue,
} from "../../shared/contracts/index.js";

export type EntryRow = {
  id: number;
  client_entry_id: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  status: EntryStatus;
  tags_json: string;
  source_text_hash: string;
};

export type EntryView = {
  id: number;
  client_entry_id: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  status: EntryStatus;
  tags: string[];
  source_text_hash: string;
  signal: Signal | null;
  metadata: SignalMetadata | null;
};

export type SignalRow = {
  id: number;
  entry_id: number;
  source_text_hash: string;
  schema_version: string;
  prompt_version: string;
  provider: ExtractionProvider;
  model: string;
  signal_quality: SignalQuality;
  topics: string;
  activities: string;
  markers: string;
  state_inference: string;
  emotion_signals: string;
  metric_confidence: string;
  entry_intent: string;
  structure_signal: string;
  temporal_context: string;
  quality_reason: string;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  error_code: string | null;
  created_at: string;
};

export type EffectiveSignalRow = {
  entry_id: number;
  entry_date: string;
  source_text_hash: string;
  schema_version: string;
  prompt_version: string;
  provider: ExtractionProvider;
  model: string;
  signal_quality: SignalQuality;
  topics: string;
  activities: string;
  markers: string;
  state_inference: string;
  emotion_signals: string;
  metric_confidence: string;
  entry_intent: string;
  structure_signal: string;
  temporal_context: string;
  quality_reason: string;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  error_code: string | null;
  created_at: string;
};

export type AnalyticsWindow = "week" | "month";

export type ServerSelfReportDailyAggregate = SelfReportDailyAggregate;
