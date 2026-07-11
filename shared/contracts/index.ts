/**
 * Single public import surface for client/server protocol types. Keep domain
 * implementation details out of this barrel and version breaking payloads.
 */
export type {
  EntryStatus,
  ServerEntry,
} from "./entries.js";
export type {
  ExtractionConfig,
  ExtractionProviderOption,
  ExtractionSettings,
  ExtractionStatus,
} from "./extraction.js";
export type {
  ConfidenceLevel,
  EntryIntent,
  EntryIntentSignal,
  ExtractionProvider,
  ExtractionResult,
  MetricConfidence,
  MetricName,
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
} from "./signal.js";
export type {
  SignalContextFields,
  SignalContextInput,
} from "./signalAnalysis.js";
export type {
  InsightLayer,
  InsightSnapshot,
} from "./insights.js";
export type {
  SelfReportAxis,
  SelfReportDailyAggregate,
} from "./selfReports.js";
