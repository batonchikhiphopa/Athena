import { LOCAL_EXPORT_VERSION, type AthenaLocalExportV1 } from "./exportTypes";
import { validateLocalExportPackage } from "./importValidation";

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

export function buildLocalImportPreview(
  packageData: AthenaLocalExportV1,
  currentData: LocalImportCurrentDataSummary = {},
): LocalImportPreview {
  const validated = validateLocalExportPackage(packageData);
  const currentEntryIds = new Set(
    (currentData.entries ?? []).map((entry) => entry.id),
  );
  const currentSelfReportIds = new Set(
    (currentData.selfReportEvents ?? []).map((event) => event.id),
  );
  const duplicateEntryIds = validated.entries
    .map((entry) => entry.id)
    .filter((id) => currentEntryIds.has(id))
    .sort();
  const duplicateSelfReportIds = validated.self_reports.events
    .map((event) => event.id)
    .filter((id) => currentSelfReportIds.has(id))
    .sort();
  const entryDates = validated.entries
    .map((entry) => entry.entry_date)
    .sort((left, right) => left.localeCompare(right));
  const hasKnownCurrentData =
    currentData.entries !== undefined ||
    currentData.selfReportEvents !== undefined;
  const currentLocalData = hasKnownCurrentData
    ? (currentData.entries?.length ?? 0) > 0 ||
      (currentData.selfReportEvents?.length ?? 0) > 0
      ? "exists"
      : "empty"
    : "unknown";

  return {
    export_version: validated.export_version,
    exported_at: validated.exported_at,
    entries_count: validated.entries.length,
    self_report_events_count: validated.self_reports.events.length,
    first_entry_date: entryDates[0] ?? null,
    last_entry_date: entryDates.at(-1) ?? null,
    possible_duplicate_entry_ids: duplicateEntryIds,
    possible_duplicate_self_report_ids: duplicateSelfReportIds,
    current_local_data: currentLocalData,
    mode: "replace_local_data",
    backend_calls_required: false,
    writes_during_preview: false,
    warnings: buildWarnings(validated, currentLocalData, {
      duplicateEntryIds,
      duplicateSelfReportIds,
    }),
  };
}

function buildWarnings(
  data: AthenaLocalExportV1,
  currentLocalData: LocalImportPreview["current_local_data"],
  duplicates: {
    duplicateEntryIds: string[];
    duplicateSelfReportIds: string[];
  },
) {
  const warnings: string[] = [];
  if (data.entries.some((entry) => entry.text.length > 0)) {
    warnings.push("local_export_contains_raw_diary_text");
  }
  if (data.entries.some((entry) => entry.source_text_hash !== null)) {
    warnings.push("source_text_hash_is_fingerprint_metadata");
  }
  if (currentLocalData === "exists") {
    warnings.push("replace_local_data_will_overwrite_current_browser_data");
  }
  if (
    duplicates.duplicateEntryIds.length > 0 ||
    duplicates.duplicateSelfReportIds.length > 0
  ) {
    warnings.push("possible_duplicate_ids_found");
  }
  return warnings;
}
