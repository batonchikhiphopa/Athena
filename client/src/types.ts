export type Page = "editor" | "entries" | "observations" | "graph" | "settings";
export type ExtractionProvider = "ollama" | "gemini" | "off";
export type EntrySortDirection = "desc" | "asc";

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

export type LocalEntry = {
  id: string;
  serverId: number | null;
  text: string;
  entry_date: string;
  tags: string[];
  source_text_hash: string;
  signals: Signal;
  metadata: SignalMetadata;
  sync_status: "syncing" | "synced" | "local_only" | "pending_reextract";
  createdAt: string;
  updatedAt: string;
};

export type ServerEntry = {
  id: number;
  client_entry_id: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  status: "extracted" | "fallback" | "failed";
  tags: string[];
  source_text_hash: string;
  signal: Signal | null;
  metadata: SignalMetadata | null;
};

export type EntryView = {
  id: string;
  serverId: number | null;
  text: string;
  textUnavailable: boolean;
  entryDate: string;
  tags: string[];
  sourceTextHash: string;
  signals: Signal;
  metadata: SignalMetadata;
  syncStatus: LocalEntry["sync_status"];
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
};

export type ExtractionConfig = {
  defaults: ExtractionSettings;
  providers: ExtractionProviderOption[];
};

export type ExtractionResult = {
  signal: Signal;
  metadata: SignalMetadata;
};

export type ExtractionProviderOption = {
  id: ExtractionProvider;
  label: string;
  defaultModel: string;
  models: string[];
  configured: boolean;
};

export type ExtractionSettings = {
  provider: ExtractionProvider;
  model: string;
};

export type ExtractionStatus = {
  provider: ExtractionProvider;
  model: string;
  available: boolean;
  reason: string | null;
};

export type InsightSnapshot = {
  id: number;
  layer: "day" | "week" | "month";
  period_start: string;
  period_end: string;
  text: string;
  generated_at: string;
  expires_at: string;
};
