export type SelfReportAxis =
  | "mood"
  | "stress"
  | "energy"
  | "sleep_quality"
  | "function";

export type SelfReportDailyAggregate = {
  id?: number;
  local_day: string;
  axis: SelfReportAxis;
  count: number;
  sum: number;
  sum_squares: number;
  mean: number;
  min: number;
  max: number;
  schema_version: string;
  aggregate_version: string;
  updated_at: string;
};
