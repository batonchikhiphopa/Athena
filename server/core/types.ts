export type ExtractionProvider = "ollama" | "gemini" | "off";

export type SignalQuality = "valid" | "sparse" | "fallback";

export type Signal = {
  topics: string[];
  activities: string[];
  markers: string[];
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

export type EntryStatus = "extracted" | "fallback" | "failed";

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
  signal_json: string;
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
  topics_json: string;
  activities_json: string;
  markers_json: string;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  error_code: string | null;
  created_at: string;
};

export type AnalyticsWindow = "week" | "month";

export type InsightLayer = "day" | "week" | "month";

export type InsightSnapshot = {
  id: number;
  layer: InsightLayer;
  period_start: string;
  period_end: string;
  topic: string | null;
  text: string;
  generated_at: string;
  expires_at: string;
};

export type ExtractionResult = {
  signal: Signal;
  metadata: SignalMetadata;
};
