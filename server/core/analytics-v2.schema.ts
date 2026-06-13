export const ANALYTICS_V2_VERSION = "analytics.v2" as const;

export const EXTRACTED_ANALYTICS_AXES = ["load", "fatigue", "focus"] as const;
export const SELF_REPORT_ANALYTICS_AXES = [
  "mood",
  "stress",
  "energy",
  "sleep_quality",
  "function",
] as const;
export const ANALYTICS_V2_AXES = [
  ...EXTRACTED_ANALYTICS_AXES,
  ...SELF_REPORT_ANALYTICS_AXES,
] as const;

export type ExtractedAnalyticsAxis = (typeof EXTRACTED_ANALYTICS_AXES)[number];
export type SelfReportAnalyticsAxis =
  (typeof SELF_REPORT_ANALYTICS_AXES)[number];
export type AnalyticsV2Axis = (typeof ANALYTICS_V2_AXES)[number];

export type AnalyticsV2WindowKind = "baseline" | "day" | "week" | "month";
export type AnalyticsV2AxisSource = "extracted" | "self_report";
export type AnalyticsV2BaselineQuality =
  | "insufficient"
  | "weak"
  | "usable"
  | "strong";
export type AnalyticsV2Direction = "down" | "stable" | "up" | "unknown";
export type AnalyticsV2TrendDirection =
  | "falling"
  | "flat"
  | "rising"
  | "unknown";
export type AnalyticsV2VolatilityDirection =
  | "less_variable"
  | "more_variable"
  | "stable"
  | "unknown";
export type AnalyticsV2QualityGrade =
  | "insufficient"
  | "weak"
  | "usable"
  | "strong";
export type AnalyticsV2QualityReason =
  | "ok"
  | "no_axis_samples"
  | "no_valid_signals"
  | "version_boundary"
  | "weak_support";
export type AnalyticsV2NoDataReason = "no_data";
export type AnalyticsV2AssociationDirection =
  | "negative"
  | "none"
  | "positive"
  | "unknown";
export type AnalyticsV2AssociationStrength =
  | "weak"
  | "moderate"
  | "strong"
  | "unknown";

export type AnalyticsV2Window = {
  days: number;
  end: string;
  kind: AnalyticsV2WindowKind;
  start: string;
};

export type AnalyticsV2Density = {
  entry_coverage: number;
  entry_days: number;
  fallback_days: number;
  fallback_density: number;
  missingness: number;
  no_entry_days: number;
  sparse_days: number;
  valid_days: number;
  valid_density: number;
};

export type AnalyticsV2AxisSummary = {
  baseline_mean: number | null;
  baseline_quality: AnalyticsV2BaselineQuality;
  baseline_sample_days: number;
  baseline_sd: number | null;
  current_mean: number | null;
  current_sample_days: number;
  delta_from_baseline: number | null;
  direction: AnalyticsV2Direction;
  source: AnalyticsV2AxisSource;
  slope: number | null;
  sudden_change: boolean;
  sudden_delta: number | null;
  trend_direction: AnalyticsV2TrendDirection;
  uncertainty: string[];
  volatility: number | null;
  volatility_delta: number | null;
  volatility_direction: AnalyticsV2VolatilityDirection;
  z_delta: number | null;
};

export type AnalyticsV2ContextItem = {
  count: number;
  days: number;
  name: string;
};

export type AnalyticsV2Context = {
  activities: AnalyticsV2ContextItem[];
  markers: AnalyticsV2ContextItem[];
  recurrence: {
    markers: AnalyticsV2ContextItem[];
    tags: AnalyticsV2ContextItem[];
    topics: AnalyticsV2ContextItem[];
  };
  tags: AnalyticsV2ContextItem[];
  topics: AnalyticsV2ContextItem[];
};

export type AnalyticsV2Quality = {
  flags: string[];
  grade: AnalyticsV2QualityGrade;
  reason: AnalyticsV2QualityReason;
};

export type AnalyticsV2Versions = {
  baseline: {
    models: string[];
    prompt_versions: string[];
    schema_versions: string[];
    self_report_aggregate_versions: string[];
  };
  current: {
    models: string[];
    prompt_versions: string[];
    schema_versions: string[];
    self_report_aggregate_versions: string[];
  };
  mixed_model: boolean;
  version_boundary_blocks_comparison: boolean;
};

export type AnalyticsV2Association = {
  correlation: number | null;
  direction: AnalyticsV2AssociationDirection;
  left_axis: ExtractedAnalyticsAxis;
  paired_days: number;
  right_axis: SelfReportAnalyticsAxis;
  strength: AnalyticsV2AssociationStrength;
  uncertainty: string[];
};

export type AnalyticsV2Summary = {
  axes: Record<AnalyticsV2Axis, AnalyticsV2AxisSummary>;
  associations: AnalyticsV2Association[];
  baseline_window: AnalyticsV2Window;
  context: AnalyticsV2Context;
  density: AnalyticsV2Density;
  quality: AnalyticsV2Quality;
  version: typeof ANALYTICS_V2_VERSION;
  versions: AnalyticsV2Versions;
  window: AnalyticsV2Window;
};

export type AnalyticsV2WindowResponse = {
  reason: AnalyticsV2NoDataReason | null;
  summary: AnalyticsV2Summary | null;
};

export type AnalyticsV2Overview = {
  month: AnalyticsV2WindowResponse;
  week: AnalyticsV2WindowResponse;
};
