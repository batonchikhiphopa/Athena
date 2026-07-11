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

const LOCAL_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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

const FORBIDDEN_IMPORT_KEYS = new Set([
  "api_key",
  "apiKey",
  "auth_token",
  "authToken",
  "access_token",
  "accessToken",
  "refresh_token",
  "refreshToken",
  "csrf_token",
  "csrfToken",
  "session_token",
  "sessionToken",
  "sessionTokenHash",
  "session_token_hash",
  "vault_key",
  "vaultKey",
  "vault_password",
  "vaultPassword",
  "password",
  "password_hash",
  "passwordHash",
  "provider_api_key",
  "providerApiKey",
  "private_key",
  "privateKey",
  "secret",
]);

export type LocalImportCurrentDataSummary = {
  entries?: Array<{ id: string }>;
  selfReportEvents?: Array<{ id: string }>;
};

export type LocalImportPreview = {
  export_version: typeof LOCAL_EXPORT_VERSION;
  exported_at: string;
  entries_count: number;
  self_report_events_count: number;
  first_entry_date: string | null;
  last_entry_date: string | null;
  possible_duplicate_entry_ids: string[];
  possible_duplicate_self_report_ids: string[];
  current_local_data: "unknown" | "empty" | "exists";
  mode: "replace_local_data";
  backend_calls_required: false;
  writes_during_preview: false;
  warnings: string[];
};

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

export function buildLocalImportPreview(
  packageData: AthenaLocalExportV1,
  currentData: LocalImportCurrentDataSummary = {},
): LocalImportPreview {
  const validated = validateLocalExportPackage(packageData);

  const importedEntryIds = new Set(validated.entries.map((entry) => entry.id));
  const importedSelfReportIds = new Set(
    validated.self_reports.events.map((event) => event.id),
  );

  const currentEntryIds = new Set(
    (currentData.entries ?? []).map((entry) => entry.id),
  );
  const currentSelfReportIds = new Set(
    (currentData.selfReportEvents ?? []).map((event) => event.id),
  );

  const possibleDuplicateEntryIds = Array.from(importedEntryIds)
    .filter((id) => currentEntryIds.has(id))
    .sort();

  const possibleDuplicateSelfReportIds = Array.from(importedSelfReportIds)
    .filter((id) => currentSelfReportIds.has(id))
    .sort();

  const entryDates = validated.entries
    .map((entry) => entry.entry_date)
    .sort((left, right) => left.localeCompare(right));

  const hasKnownCurrentData =
    currentData.entries !== undefined || currentData.selfReportEvents !== undefined;

  const currentLocalData = hasKnownCurrentData
    ? (currentData.entries?.length ?? 0) > 0 ||
      (currentData.selfReportEvents?.length ?? 0) > 0
      ? "exists"
      : "empty"
    : "unknown";

  const warnings: string[] = [];

  if (validated.entries.some((entry) => entry.text.length > 0)) {
    warnings.push("local_export_contains_raw_diary_text");
  }

  if (validated.entries.some((entry) => entry.source_text_hash !== null)) {
    warnings.push("source_text_hash_is_fingerprint_metadata");
  }

  if (currentLocalData === "exists") {
    warnings.push("replace_local_data_will_overwrite_current_browser_data");
  }

  if (
    possibleDuplicateEntryIds.length > 0 ||
    possibleDuplicateSelfReportIds.length > 0
  ) {
    warnings.push("possible_duplicate_ids_found");
  }

  return {
    export_version: validated.export_version,
    exported_at: validated.exported_at,
    entries_count: validated.entries.length,
    self_report_events_count: validated.self_reports.events.length,
    first_entry_date: entryDates[0] ?? null,
    last_entry_date: entryDates.at(-1) ?? null,
    possible_duplicate_entry_ids: possibleDuplicateEntryIds,
    possible_duplicate_self_report_ids: possibleDuplicateSelfReportIds,
    current_local_data: currentLocalData,
    mode: "replace_local_data",
    backend_calls_required: false,
    writes_during_preview: false,
    warnings,
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

function assertNoForbiddenKeys(value: unknown, path = "$"): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) return;

  for (const [key, nestedValue] of Object.entries(value)) {
    assertCondition(
      !FORBIDDEN_IMPORT_KEYS.has(key),
      `Forbidden sensitive field in import package: ${path}.${key}`,
    );
    assertNoForbiddenKeys(nestedValue, `${path}.${key}`);
  }
}

function assertAllowedKeys<TAllowed extends readonly string[]>(
  value: Record<string, unknown>,
  allowedKeys: TAllowed,
  context: string,
): void {
  const allowed = new Set<string>(allowedKeys as readonly string[]);

  for (const key of Object.keys(value)) {
    assertCondition(allowed.has(key), `Unexpected ${context} field: ${key}`);
  }
}

function assertPlainObject(
  value: unknown,
  message: string,
): Record<string, unknown> {
  assertCondition(isPlainObject(value), message);
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readExact<TExpected extends string>(
  object: Record<string, unknown>,
  key: string,
  expected: TExpected,
  message: string,
): TExpected {
  assertEquals(object[key], expected, message);
  return expected;
}

function readString(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = object[key];
  assertCondition(typeof value === "string", message);
  return value;
}

function readNonEmptyString(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = readString(object, key, message);
  assertCondition(value.trim().length > 0, message);
  return value;
}

function readNullableString(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string | null {
  const value = object[key];

  if (value === null) return null;
  assertCondition(typeof value === "string", message);

  return value;
}

function readBoolean(
  object: Record<string, unknown>,
  key: string,
  message: string,
): boolean {
  const value = object[key];
  assertCondition(typeof value === "boolean", message);
  return value;
}

function readNullableNonNegativeInteger(
  object: Record<string, unknown>,
  key: string,
  message: string,
): number | null {
  const value = object[key];

  if (value === null) return null;

  assertCondition(
    Number.isInteger(value) && typeof value === "number" && value >= 0,
    message,
  );

  return value;
}

function readStringArray(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string[] {
  const value = object[key];

  assertCondition(Array.isArray(value), message);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of value) {
    assertCondition(typeof item === "string", message);

    const normalized = item.trim();

    assertCondition(normalized.length > 0, message);

    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

function readLocalDay(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = readString(object, key, message);
  assertCondition(isValidLocalDay(value), message);
  return value;
}

function readIsoDate(
  object: Record<string, unknown>,
  key: string,
  message: string,
): string {
  const value = readString(object, key, message);
  assertIsoDate(value, message);
  return value;
}

function readNullableSelfReportValue(
  object: Record<string, unknown>,
  key: keyof LocalExportSelfReportValuesV1,
): number | null {
  const value = object[key];

  if (value === null) return null;

  assertCondition(
    typeof value === "number" &&
      Number.isInteger(value) &&
      value >= 0 &&
      value <= 10,
    `Invalid self-report value: ${key}`,
  );

  return value;
}

function readNullableJsonValue(
  object: Record<string, unknown>,
  key: string,
  message: string,
): unknown | null {
  const value = object[key];

  if (value === null) return null;

  assertJsonValue(value, message);

  return value;
}

function assertJsonValue(value: unknown, message: string): void {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    assertCondition(
      typeof value !== "number" || Number.isFinite(value),
      message,
    );
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => assertJsonValue(item, message));
    return;
  }

  if (isPlainObject(value)) {
    Object.values(value).forEach((item) => assertJsonValue(item, message));
    return;
  }

  throw new Error(message);
}

function isValidLocalDay(value: string): boolean {
  const match = value.match(LOCAL_DAY_PATTERN);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function assertIsoDate(value: string, message: string): void {
  const timestamp = Date.parse(value);

  assertCondition(!Number.isNaN(timestamp), message);
  assertCondition(new Date(timestamp).toISOString() === value, message);
}

function assertEquals<TExpected>(
  actual: unknown,
  expected: TExpected,
  message: string,
): asserts actual is TExpected {
  assertCondition(actual === expected, message);
}

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}
