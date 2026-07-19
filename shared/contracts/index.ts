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
  ActivityContext,
  ActivityContextAgency,
  ActivityContextBlocker,
  ActivityContextEffect,
  ActivityContextEvent,
  ActivityContextKind,
  ActivityContextNextStep,
  ActivityContextOutcome,
  ActivityContextStrategy,
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
export {
  ACTIVITY_CONTEXT_AGENCIES,
  ACTIVITY_CONTEXT_BLOCKERS,
  ACTIVITY_CONTEXT_EFFECTS,
  ACTIVITY_CONTEXT_EVENTS,
  ACTIVITY_CONTEXT_KINDS,
  ACTIVITY_CONTEXT_NEXT_STEPS,
  ACTIVITY_CONTEXT_OUTCOMES,
  ACTIVITY_CONTEXT_STRATEGIES,
  CONFIDENCE_LEVELS,
  METRIC_NAMES,
  SIGNAL_AXES,
  SIGNAL_LEVELS,
} from "./signal.js";
export type {
  SignalContextFields,
  SignalContextInput,
} from "./signalAnalysis.js";
export {
  ACTIVE_EXTRACTION_PROMPT_VERSION,
  ACTIVE_SIGNAL_SCHEMA_VERSION,
} from "./signalVersions.js";
export type {
  InsightLayer,
  InsightSnapshot,
} from "./insights.js";
export type {
  SelfReportAxis,
  SelfReportDailyAggregate,
} from "./selfReports.js";
export type {
  ActivityInsight,
  ActivityInsightBurnoutRelation,
  ActivityInsightConfidence,
  ActivityInsightContext,
  ActivityInsightEvent,
  ActivityInsightInput,
  ActivityInsightKind,
  ActivityInsightLanguage,
  ActivityInsightRhythm,
  ActivityInsightSource,
  ActivityInsightsRequest,
  ActivityInsightsResponse,
  ActivityInsightStage,
  ActivityInsightStatus,
} from "./activityInsights.js";
export {
  ACTIVITY_INSIGHT_BURNOUT_RELATIONS,
  ACTIVITY_INSIGHT_EVENTS,
  ACTIVITY_INSIGHT_KINDS,
  ACTIVITY_INSIGHT_LANGUAGES,
  ACTIVITY_INSIGHT_RHYTHMS,
  ACTIVITY_INSIGHT_STAGES,
  ACTIVITY_INSIGHT_STATUSES,
} from "./activityInsights.js";
