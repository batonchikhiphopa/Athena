/**
 * Treats imported JSON as hostile input. Validation is exact and recursive so
 * prototype keys, unknown fields, invalid dates, and incompatible versions do
 * not reach IndexedDB or local settings.
 */
import {
  ATHENA_EXPORT_APP_ID,
  EXPORT_PROMPT_VERSION,
  EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION,
  EXPORT_SELF_REPORT_SCHEMA_VERSION,
  EXPORT_SIGNAL_SCHEMA_VERSION,
  EXPORTABLE_QUEUE_STATUSES,
  LOCAL_EXPORT_VERSION,
  type AthenaLocalExportV1,
  type LocalExportEntryV1,
  type LocalExportSelfReportValuesV1,
  type LocalExportSettingsV1,
  type LocalExportSourceV1,
  type QueueExportSummaryV1,
} from "./exportTypes";
import {
  assertAllowedKeys,
  assertCondition,
  assertEquals,
  assertNoForbiddenKeys,
  assertPlainObject,
  readBoolean,
  readExact,
  readIsoDate,
  readLocalDay,
  readNonEmptyString,
  readNullableJsonValue,
  readNullableNonNegativeInteger,
  readNullableSelfReportValue,
  readNullableString,
  readString,
  readStringArray,
} from "./importReaders";

const ROOT_KEYS = [
  "app",
  "export_version",
  "exported_at",
  "source",
  "entries",
  "self_reports",
  "settings",
  "queue",
] as const;

const SOURCE_KEYS = [
  "app_version",
  "schema_version",
  "prompt_version",
  "self_report_schema_version",
  "self_report_daily_aggregate_version",
] as const;

const ENTRY_KEYS = [
  "id",
  "server_id",
  "text",
  "entry_date",
  "tags",
  "analysis_enabled",
  "created_at",
  "updated_at",
  "source_text_hash",
  "signal",
  "metadata",
] as const;

const SELF_REPORTS_KEYS = ["events"] as const;

const SELF_REPORT_EVENT_KEYS = [
  "id",
  "entry_id",
  "local_day",
  "created_at",
  "updated_at",
  "values",
  "schema_version",
] as const;

const SELF_REPORT_VALUE_KEYS = [
  "mood",
  "stress",
  "energy",
  "sleep_quality",
  "function",
] as const;

const SETTINGS_KEYS = [
  "extraction_provider",
  "extraction_model",
  "interface_language",
  "entry_sort_direction",
  "persona_text_enabled",
  "local_emotion_spike_enabled",
] as const;

const QUEUE_KEYS = ["pending_jobs"] as const;

const QUEUE_SUMMARY_KEYS = [
  "type",
  "entity_kind",
  "entity_id",
  "status",
  "reason",
] as const;

const QUEUE_TYPES = new Set([
  "entry.sync",
  "entry.delete_remote",
  "entry.extract",
  "entry.append_signal",
  "entry.reprocess_signal",
  "self_report.sync_daily_aggregate",
  "semantic.index_entry",
  "semantic.reindex_all",
]);

const SAFE_QUEUE_REASONS = new Set([
  "fallback",
  "sparse_no_metrics",
  "provider_failure",
  "manual_reprocess",
]);

export function parseAndValidateLocalExportJson(
  jsonText: string,
): AthenaLocalExportV1 {
  if (typeof jsonText !== "string") {
    throw new Error("Import file must be JSON text.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON import file.");
  }

  return validateLocalExportPackage(parsed);
}

export function validateLocalExportPackage(
  value: unknown,
): AthenaLocalExportV1 {
  assertNoForbiddenKeys(value);

  const root = assertPlainObject(value, "Import package must be a JSON object.");
  assertAllowedKeys(root, ROOT_KEYS, "local export package");

  assertEquals(root.app, ATHENA_EXPORT_APP_ID, "Invalid app id.");
  assertEquals(
    root.export_version,
    LOCAL_EXPORT_VERSION,
    "Unsupported export version. Expected local_export.v1.",
  );

  const exportedAt = readIsoDate(root, "exported_at", "Invalid exported_at timestamp.");
  const source = validateSource(root.source);
  const entries = validateEntries(root.entries);
  const selfReports = validateSelfReports(root.self_reports);
  const settings = validateSettings(root.settings);
  const queue = validateQueue(root.queue);

  return {
    app: ATHENA_EXPORT_APP_ID,
    export_version: LOCAL_EXPORT_VERSION,
    exported_at: exportedAt,
    source,
    entries,
    self_reports: selfReports,
    settings,
    queue,
  };
}

function validateSource(value: unknown): LocalExportSourceV1 {
  const source = assertPlainObject(value, "Invalid export source.");
  assertAllowedKeys(source, SOURCE_KEYS, "export source");

  return {
    app_version: readNullableString(source, "app_version", "Invalid app_version."),
    schema_version: readExact(
      source,
      "schema_version",
      EXPORT_SIGNAL_SCHEMA_VERSION,
      "Invalid schema_version.",
    ),
    prompt_version: readExact(
      source,
      "prompt_version",
      EXPORT_PROMPT_VERSION,
      "Invalid prompt_version.",
    ),
    self_report_schema_version: readExact(
      source,
      "self_report_schema_version",
      EXPORT_SELF_REPORT_SCHEMA_VERSION,
      "Invalid self_report_schema_version.",
    ),
    self_report_daily_aggregate_version: readExact(
      source,
      "self_report_daily_aggregate_version",
      EXPORT_SELF_REPORT_DAILY_AGGREGATE_VERSION,
      "Invalid self_report_daily_aggregate_version.",
    ),
  };
}

function validateEntries(value: unknown): LocalExportEntryV1[] {
  assertCondition(Array.isArray(value), "Invalid entries array.");

  const seenIds = new Set<string>();

  return value.map((entryValue, index) => {
    const entry = assertPlainObject(entryValue, `Invalid entry at index ${index}.`);
    assertAllowedKeys(entry, ENTRY_KEYS, `entry at index ${index}`);

    const id = readNonEmptyString(entry, "id", "Invalid entry id.");
    assertCondition(!seenIds.has(id), `Duplicate entry id: ${id}`);
    seenIds.add(id);

    const sourceTextHash = readNullableString(
      entry,
      "source_text_hash",
      "Invalid source_text_hash.",
    );

    if (sourceTextHash !== null) {
      assertCondition(
        /^[a-f0-9]{64}$/.test(sourceTextHash),
        "Invalid source_text_hash.",
      );
    }

    return {
      id,
      server_id: readNullableNonNegativeInteger(
        entry,
        "server_id",
        "Invalid server_id.",
      ),
      text: readString(entry, "text", "Invalid entry text."),
      entry_date: readLocalDay(entry, "entry_date", "Invalid entry_date."),
      tags: readStringArray(entry, "tags", "Invalid entry tags."),
      analysis_enabled: readBoolean(
        entry,
        "analysis_enabled",
        "Invalid analysis_enabled value.",
      ),
      created_at: readIsoDate(
        entry,
        "created_at",
        "Invalid entry created_at timestamp.",
      ),
      updated_at: readIsoDate(
        entry,
        "updated_at",
        "Invalid entry updated_at timestamp.",
      ),
      source_text_hash: sourceTextHash,
      signal: readNullableJsonValue(entry, "signal", "Invalid signal value."),
      metadata: readNullableJsonValue(entry, "metadata", "Invalid metadata value."),
    };
  });
}

function validateSelfReports(value: unknown): AthenaLocalExportV1["self_reports"] {
  const selfReports = assertPlainObject(value, "Invalid self_reports object.");
  assertAllowedKeys(selfReports, SELF_REPORTS_KEYS, "self_reports");

  assertCondition(
    Array.isArray(selfReports.events),
    "Invalid self_reports.events array.",
  );

  const seenIds = new Set<string>();

  const events = selfReports.events.map((eventValue, index) => {
    const event = assertPlainObject(
      eventValue,
      `Invalid self-report event at index ${index}.`,
    );
    assertAllowedKeys(event, SELF_REPORT_EVENT_KEYS, `self-report event ${index}`);

    const id = readNonEmptyString(event, "id", "Invalid self-report id.");
    assertCondition(!seenIds.has(id), `Duplicate self-report id: ${id}`);
    seenIds.add(id);

    return {
      id,
      entry_id: readNonEmptyString(
        event,
        "entry_id",
        "Invalid self-report entry_id.",
      ),
      local_day: readLocalDay(
        event,
        "local_day",
        "Invalid self-report local_day.",
      ),
      created_at: readIsoDate(
        event,
        "created_at",
        "Invalid self-report created_at timestamp.",
      ),
      updated_at: readIsoDate(
        event,
        "updated_at",
        "Invalid self-report updated_at timestamp.",
      ),
      values: validateSelfReportValues(event.values),
      schema_version: readExact(
        event,
        "schema_version",
        EXPORT_SELF_REPORT_SCHEMA_VERSION,
        "Invalid self-report schema_version.",
      ),
    };
  });

  return { events };
}

function validateSelfReportValues(value: unknown): LocalExportSelfReportValuesV1 {
  const values = assertPlainObject(value, "Invalid self-report values.");
  assertAllowedKeys(values, SELF_REPORT_VALUE_KEYS, "self-report values");

  return {
    mood: readNullableSelfReportValue(values, "mood"),
    stress: readNullableSelfReportValue(values, "stress"),
    energy: readNullableSelfReportValue(values, "energy"),
    sleep_quality: readNullableSelfReportValue(values, "sleep_quality"),
    function: readNullableSelfReportValue(values, "function"),
  };
}

function validateSettings(value: unknown): LocalExportSettingsV1 {
  const settings = assertPlainObject(value, "Invalid settings object.");
  assertAllowedKeys(settings, SETTINGS_KEYS, "settings");

  const result: LocalExportSettingsV1 = {};

  if (settings.extraction_provider !== undefined) {
    assertCondition(
      settings.extraction_provider === "ollama" ||
        settings.extraction_provider === "gemini" ||
        settings.extraction_provider === "off",
      "Invalid extraction_provider.",
    );
    result.extraction_provider = settings.extraction_provider;
  }

  if (settings.extraction_model !== undefined) {
    result.extraction_model = readNonEmptyString(
      settings,
      "extraction_model",
      "Invalid extraction_model.",
    );
  }

  if (settings.interface_language !== undefined) {
    result.interface_language = readNonEmptyString(
      settings,
      "interface_language",
      "Invalid interface_language.",
    );
  }

  if (settings.entry_sort_direction !== undefined) {
    assertCondition(
      settings.entry_sort_direction === "asc" ||
        settings.entry_sort_direction === "desc",
      "Invalid entry_sort_direction.",
    );
    result.entry_sort_direction = settings.entry_sort_direction;
  }

  if (settings.persona_text_enabled !== undefined) {
    result.persona_text_enabled = readBoolean(
      settings,
      "persona_text_enabled",
      "Invalid persona_text_enabled.",
    );
  }

  if (settings.local_emotion_spike_enabled !== undefined) {
    result.local_emotion_spike_enabled = readBoolean(
      settings,
      "local_emotion_spike_enabled",
      "Invalid local_emotion_spike_enabled.",
    );
  }

  return result;
}

function validateQueue(value: unknown): AthenaLocalExportV1["queue"] {
  const queue = assertPlainObject(value, "Invalid queue object.");
  assertAllowedKeys(queue, QUEUE_KEYS, "queue");

  assertCondition(
    Array.isArray(queue.pending_jobs),
    "Invalid queue.pending_jobs array.",
  );

  return {
    pending_jobs: queue.pending_jobs.map((jobValue, index) =>
      validateQueueExportSummary(jobValue, index),
    ),
  };
}

function validateQueueExportSummary(
  value: unknown,
  index: number,
): QueueExportSummaryV1 {
  const job = assertPlainObject(value, `Invalid queue job summary at index ${index}.`);
  assertAllowedKeys(job, QUEUE_SUMMARY_KEYS, `queue job summary ${index}`);

  const type = readNonEmptyString(job, "type", "Invalid queue job type.");
  assertCondition(QUEUE_TYPES.has(type), "Invalid queue job type.");

  const status = readNonEmptyString(job, "status", "Invalid queue job status.");
  assertCondition(
    (EXPORTABLE_QUEUE_STATUSES as readonly string[]).includes(status),
    "Invalid queue job status.",
  );

  const summary: QueueExportSummaryV1 = {
    type: type as QueueExportSummaryV1["type"],
    entity_kind: readNullableString(
      job,
      "entity_kind",
      "Invalid queue entity_kind.",
    ),
    entity_id: readNullableString(job, "entity_id", "Invalid queue entity_id."),
    status: status as QueueExportSummaryV1["status"],
  };

  if (job.reason !== undefined) {
    const reason = readNonEmptyString(job, "reason", "Invalid queue reason.");
    assertCondition(SAFE_QUEUE_REASONS.has(reason), "Invalid queue reason.");
    summary.reason = reason;
  }

  return summary;
}
