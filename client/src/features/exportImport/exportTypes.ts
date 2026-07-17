import {
  ACTIVE_EXTRACTION_PROMPT_VERSION,
  ACTIVE_SIGNAL_SCHEMA_VERSION,
} from "../../shared/contracts";
import type { LocalEntry } from "../entries/entryTypes";
import type { SelfReportEvent } from "../selfReports/selfReportTypes";
import type { Signal, SignalMetadata } from "../../shared/contracts";
import type { QueueJob, QueueJobStatus, QueueJobType } from "../sync/queueTypes";

export const ATHENA_EXPORT_APP_ID = "athena" as const;
export const LOCAL_EXPORT_VERSION = "local_export.v1" as const;
export const BACKEND_METADATA_EXPORT_VERSION = "backend_metadata_export.v1" as const;

export const EXPORT_SIGNAL_SCHEMA_VERSION = ACTIVE_SIGNAL_SCHEMA_VERSION;
export const EXPORT_PROMPT_VERSION = ACTIVE_EXTRACTION_PROMPT_VERSION;
export const EXPORT_SELF_REPORT_SCHEMA_VERSION = "self_report.v1" as const;
export const EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION =
  "self_report_daily_aggregate.v1" as const;

export const EXPORTABLE_QUEUE_STATUSES = [
  "queued",
  "running",
  "blocked",
  "failed",
] as const satisfies QueueJobStatus[];

export type ExportableQueueStatus = (typeof EXPORTABLE_QUEUE_STATUSES)[number];

export type LocalExportSourceV1 = {
  app_version: string | null;
  schema_version: typeof EXPORT_SIGNAL_SCHEMA_VERSION;
  prompt_version: typeof EXPORT_PROMPT_VERSION;
  self_report_schema_version: typeof EXPORT_SELF_REPORT_SCHEMA_VERSION;
  self_report_daily_aggregate_version: typeof EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION;
};

export type LocalExportEntryV1 = {
  id: string;
  server_id: number | null;
  text: string;
  entry_date: string;
  tags: string[];
  analysis_enabled: boolean;
  created_at: string;
  updated_at: string;
  source_text_hash: string;
  signal: Signal;
  metadata: SignalMetadata;
};

export type LocalExportSelfReportValuesV1 = {
  mood: number | null;
  stress: number | null;
  energy: number | null;
  sleep_quality: number | null;
  function: number | null;
};

export type LocalExportSelfReportEventV1 = {
  id: string;
  entry_id: string;
  local_day: string;
  created_at: string;
  updated_at: string;
  values: LocalExportSelfReportValuesV1;
  schema_version: typeof EXPORT_SELF_REPORT_SCHEMA_VERSION;
};

export type LocalExportSettingsV1 = {
  extraction_provider?: "ollama" | "gemini" | "off";
  extraction_model?: string;
  interface_language?: string;
  entry_sort_direction?: "asc" | "desc";
  persona_text_enabled?: boolean;
};

export type QueueExportSummaryV1 = {
  type: QueueJobType;
  entity_kind: string | null;
  entity_id: string | null;
  status: ExportableQueueStatus;
  reason?: string;
};

export type AthenaLocalExportV1 = {
  app: typeof ATHENA_EXPORT_APP_ID;
  export_version: typeof LOCAL_EXPORT_VERSION;
  exported_at: string;
  source: LocalExportSourceV1;
  entries: LocalExportEntryV1[];
  self_reports: {
    events: LocalExportSelfReportEventV1[];
  };
  settings: LocalExportSettingsV1;
  queue: {
    pending_jobs: QueueExportSummaryV1[];
  };
};

export type BuildLocalExportPackageInput = {
  appVersion?: string | null;
  exportedAt?: string;
  source?: Partial<LocalExportSourceV1>;
  entries: LocalEntry[];
  selfReportEvents?: SelfReportEvent[];
  settings?: Partial<Record<string, unknown>>;
  queueJobs?: QueueJob[];
};

export type AthenaBackendMetadataExportV1 = {
  app: typeof ATHENA_EXPORT_APP_ID;
  export_version: typeof BACKEND_METADATA_EXPORT_VERSION;
  exported_at: string;
  source: LocalExportSourceV1 & {
    backend_schema_version: string | null;
  };
  entries: unknown[];
  signals: unknown[];
  effective_signals: unknown[];
  signal_overrides: unknown[];
  self_report_daily_aggregates: unknown[];
  insight_snapshots: unknown[];
};
