import type { LocalEntry } from "../entries/entryTypes";
import type { SelfReportEvent } from "../selfReports/selfReportTypes";
import type { QueueJob, QueueJobType } from "../sync/queueTypes";
import {
  ATHENA_EXPORT_APP_ID,
  EXPORT_PROMPT_VERSION,
  EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION,
  EXPORT_SELF_REPORT_SCHEMA_VERSION,
  EXPORT_SIGNAL_SCHEMA_VERSION,
  EXPORTABLE_QUEUE_STATUSES,
  LOCAL_EXPORT_VERSION,
  type AthenaLocalExportV1,
  type BuildLocalExportPackageInput,
  type LocalExportEntryV1,
  type LocalExportSelfReportEventV1,
  type LocalExportSelfReportValuesV1,
  type LocalExportSettingsV1,
  type LocalExportSourceV1,
  type QueueExportSummaryV1,
} from "./exportTypes";

const LOCAL_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_QUEUE_REASONS = new Set([
  "fallback",
  "sparse_no_metrics",
  "provider_failure",
  "manual_reprocess",
]);

const QUEUE_TYPES = new Set<QueueJobType>([
  "entry.sync",
  "entry.delete_remote",
  "entry.extract",
  "entry.append_signal",
  "entry.reprocess_signal",
  "self_report.sync_daily_aggregate",
  "semantic.index_entry",
  "semantic.reindex_all",
]);

export function buildLocalExportPackage(
  input: BuildLocalExportPackageInput,
): AthenaLocalExportV1 {
  const exportedAt = input.exportedAt ?? new Date().toISOString();

  const packageData: AthenaLocalExportV1 = {
    app: ATHENA_EXPORT_APP_ID,
    export_version: LOCAL_EXPORT_VERSION,
    exported_at: exportedAt,
    source: createExportSource(input),
    entries: input.entries.map(toLocalExportEntry),
    self_reports: {
      events: (input.selfReportEvents ?? []).map(toLocalExportSelfReportEvent),
    },
    settings: toLocalExportSettings(input.settings ?? {}),
    queue: {
      pending_jobs: sanitizeQueueJobsForExport(input.queueJobs ?? []),
    },
  };

  assertValidLocalExportPackage(packageData);

  return packageData;
}

export function createExportSource(
  input: Pick<BuildLocalExportPackageInput, "appVersion" | "source">,
): LocalExportSourceV1 {
  return {
    app_version: input.appVersion ?? input.source?.app_version ?? null,
    schema_version: input.source?.schema_version ?? EXPORT_SIGNAL_SCHEMA_VERSION,
    prompt_version: input.source?.prompt_version ?? EXPORT_PROMPT_VERSION,
    self_report_schema_version:
      input.source?.self_report_schema_version ?? EXPORT_SELF_REPORT_SCHEMA_VERSION,
    self_report_daily_aggregate_version:
      input.source?.self_report_daily_aggregate_version ??
      EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION,
  };
}

export function toLocalExportEntry(entry: LocalEntry): LocalExportEntryV1 {
  return {
    id: entry.id,
    server_id: entry.serverId ?? null,
    text: entry.text,
    entry_date: entry.entry_date,
    tags: Array.from(new Set(entry.tags.map((tag) => tag.trim()).filter(Boolean))),
    analysis_enabled: entry.analysis_enabled,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
    source_text_hash: entry.source_text_hash || null,
    signal: entry.signals ?? null,
    metadata: entry.metadata ?? null,
  };
}

export function toLocalExportSelfReportEvent(
  event: SelfReportEvent,
): LocalExportSelfReportEventV1 {
  return {
    id: event.id,
    entry_id: event.entry_id,
    local_day: event.local_day,
    created_at: event.created_at,
    updated_at: event.updated_at,
    values: toLocalExportSelfReportValues(event.values),
    schema_version: EXPORT_SELF_REPORT_SCHEMA_VERSION,
  };
}

export function toLocalExportSelfReportValues(
  values: Partial<Record<keyof LocalExportSelfReportValuesV1, unknown>>,
): LocalExportSelfReportValuesV1 {
  return {
    mood: normalizeSelfReportValue(values.mood),
    stress: normalizeSelfReportValue(values.stress),
    energy: normalizeSelfReportValue(values.energy),
    sleep_quality: normalizeSelfReportValue(values.sleep_quality),
    function: normalizeSelfReportValue(values.function),
  };
}

export function toLocalExportSettings(
  settings: Partial<Record<string, unknown>>,
): LocalExportSettingsV1 {
  const result: LocalExportSettingsV1 = {};

  if (
    settings.extraction_provider === "ollama" ||
    settings.extraction_provider === "gemini" ||
    settings.extraction_provider === "off"
  ) {
    result.extraction_provider = settings.extraction_provider;
  }

  if (typeof settings.extraction_model === "string" && settings.extraction_model) {
    result.extraction_model = settings.extraction_model;
  }

  if (typeof settings.interface_language === "string" && settings.interface_language) {
    result.interface_language = settings.interface_language;
  }

  if (
    settings.entry_sort_direction === "asc" ||
    settings.entry_sort_direction === "desc"
  ) {
    result.entry_sort_direction = settings.entry_sort_direction;
  }

  if (typeof settings.persona_text_enabled === "boolean") {
    result.persona_text_enabled = settings.persona_text_enabled;
  }

  if (typeof settings.local_emotion_spike_enabled === "boolean") {
    result.local_emotion_spike_enabled = settings.local_emotion_spike_enabled;
  }

  return result;
}

export function sanitizeQueueJobsForExport(
  jobs: QueueJob[],
): QueueExportSummaryV1[] {
  return jobs
    .filter((job): job is QueueJob & { status: QueueExportSummaryV1["status"] } =>
      isExportableQueueStatus(job.status),
    )
    .map((job) => {
      const summary: QueueExportSummaryV1 = {
        type: job.type,
        entity_kind: job.entity_kind ?? null,
        entity_id: job.entity_id ?? null,
        status: job.status,
      };
      const reason = extractSafeQueueReason(job);

      if (reason) {
        summary.reason = reason;
      }

      return summary;
    });
}

export function assertValidLocalExportPackage(
  packageData: AthenaLocalExportV1,
): void {
  assertCondition(packageData.app === ATHENA_EXPORT_APP_ID, "Invalid app id.");
  assertCondition(
    packageData.export_version === LOCAL_EXPORT_VERSION,
    "Invalid local export version.",
  );
  assertIsoDate(packageData.exported_at, "Invalid exported_at timestamp.");
  assertExportSource(packageData.source);

  const entryIds = new Set<string>();
  for (const entry of packageData.entries) {
    assertNonEmptyString(entry.id, "Invalid entry id.");
    assertCondition(!entryIds.has(entry.id), `Duplicate entry id: ${entry.id}`);
    entryIds.add(entry.id);
    assertCondition(typeof entry.text === "string", "Invalid entry text.");
    assertLocalDay(entry.entry_date, "Invalid entry_date.");
    assertCondition(Array.isArray(entry.tags), "Invalid entry tags.");
    for (const tag of entry.tags) {
      assertCondition(typeof tag === "string", "Invalid entry tag.");
    }
    assertCondition(
      typeof entry.analysis_enabled === "boolean",
      "Invalid analysis_enabled value.",
    );
    assertIsoDate(entry.created_at, "Invalid entry created_at timestamp.");
    assertIsoDate(entry.updated_at, "Invalid entry updated_at timestamp.");
    assertCondition(
      entry.source_text_hash === null || typeof entry.source_text_hash === "string",
      "Invalid source_text_hash.",
    );
  }

  const selfReportIds = new Set<string>();
  for (const event of packageData.self_reports.events) {
    assertNonEmptyString(event.id, "Invalid self-report id.");
    assertCondition(
      !selfReportIds.has(event.id),
      `Duplicate self-report id: ${event.id}`,
    );
    selfReportIds.add(event.id);
    assertNonEmptyString(event.entry_id, "Invalid self-report entry_id.");
    assertLocalDay(event.local_day, "Invalid self-report local_day.");
    assertIsoDate(event.created_at, "Invalid self-report created_at timestamp.");
    assertIsoDate(event.updated_at, "Invalid self-report updated_at timestamp.");
    assertCondition(
      event.schema_version === EXPORT_SELF_REPORT_SCHEMA_VERSION,
      "Invalid self-report schema_version.",
    );
    for (const value of Object.values(event.values)) {
      assertSelfReportValue(value);
    }
  }

  for (const job of packageData.queue.pending_jobs) {
    assertCondition(QUEUE_TYPES.has(job.type), "Invalid queue export type.");
    assertCondition(
      isExportableQueueStatus(job.status),
      "Invalid queue export status.",
    );
    assertCondition(
      job.entity_kind === null || typeof job.entity_kind === "string",
      "Invalid queue entity_kind.",
    );
    assertCondition(
      job.entity_id === null || typeof job.entity_id === "string",
      "Invalid queue entity_id.",
    );
    if (job.reason !== undefined) {
      assertCondition(SAFE_QUEUE_REASONS.has(job.reason), "Invalid queue reason.");
    }
  }
}

function isExportableQueueStatus(
  status: QueueJob["status"],
): status is QueueExportSummaryV1["status"] {
  return (EXPORTABLE_QUEUE_STATUSES as readonly string[]).includes(status);
}

function extractSafeQueueReason(job: QueueJob): string | undefined {
  if (typeof job.payload !== "object" || job.payload === null) return undefined;
  if (Array.isArray(job.payload)) return undefined;

  const reason = (job.payload as Record<string, unknown>).reason;

  if (typeof reason !== "string") return undefined;
  if (!SAFE_QUEUE_REASONS.has(reason)) return undefined;

  return reason;
}

function normalizeSelfReportValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;

  return Math.max(0, Math.min(10, Math.round(value)));
}

function assertExportSource(source: LocalExportSourceV1): void {
  assertCondition(
    source.app_version === null || typeof source.app_version === "string",
    "Invalid app_version.",
  );
  assertCondition(
    source.schema_version === EXPORT_SIGNAL_SCHEMA_VERSION,
    "Invalid schema_version.",
  );
  assertCondition(
    source.prompt_version === EXPORT_PROMPT_VERSION,
    "Invalid prompt_version.",
  );
  assertCondition(
    source.self_report_schema_version === EXPORT_SELF_REPORT_SCHEMA_VERSION,
    "Invalid self_report_schema_version.",
  );
  assertCondition(
    source.self_report_daily_aggregate_version ===
      EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION,
    "Invalid self_report_daily_aggregate_version.",
  );
}

function assertSelfReportValue(value: number | null): void {
  assertCondition(
    value === null || (Number.isInteger(value) && value >= 0 && value <= 10),
    "Invalid self-report value.",
  );
}

function assertLocalDay(value: string, message: string): void {
  assertCondition(LOCAL_DAY_PATTERN.test(value), message);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  assertCondition(!Number.isNaN(parsed.getTime()), message);
}

function assertIsoDate(value: string, message: string): void {
  assertCondition(typeof value === "string", message);
  assertCondition(!Number.isNaN(new Date(value).getTime()), message);
}

function assertNonEmptyString(value: string, message: string): void {
  assertCondition(typeof value === "string" && value.trim().length > 0, message);
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
