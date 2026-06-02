export const SELF_REPORT_SCHEMA_VERSION = "self_report.v1";
export const SELF_REPORT_DAILY_AGGREGATE_VERSION =
  "self_report_daily_aggregate.v1";

export const SELF_REPORT_AXES = [
  "mood",
  "stress",
  "energy",
  "sleep_quality",
  "function",
] as const;

export type SelfReportAxis = (typeof SELF_REPORT_AXES)[number];

export type SelfReportValues = Record<SelfReportAxis, number>;

export type SelfReportEvent = {
  id: string;
  entry_id: string;
  local_day: string;
  created_at: string;
  updated_at: string;
  values: SelfReportValues;
  schema_version: typeof SELF_REPORT_SCHEMA_VERSION;
  sync_status: "local_only" | "pending_sync" | "synced";
};

export type SelfReportDailyAggregate = {
  id: string;
  local_day: string;
  axis: SelfReportAxis;
  count: number;
  sum: number;
  sum_squares: number;
  mean: number;
  min: number;
  max: number;
  schema_version: typeof SELF_REPORT_SCHEMA_VERSION;
  aggregate_version: typeof SELF_REPORT_DAILY_AGGREGATE_VERSION;
  updated_at: string;
};

export const DEFAULT_SELF_REPORT_VALUES: SelfReportValues = {
  mood: 5,
  stress: 5,
  energy: 5,
  sleep_quality: 5,
  function: 5,
};
