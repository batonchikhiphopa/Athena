import type { LocalEntry } from "../entries/entryTypes";
import { replaceAllLocalEntries } from "../entries/localEntryRepository";
import {
  replaceAllSelfReportEvents,
  type ReplaceSelfReportEventsResult,
} from "../selfReports/selfReportStorage";
import {
  EXPORT_SELF_REPORT_SCHEMA_VERSION,
  type AthenaLocalExportV1,
  type LocalExportEntryV1,
  type LocalExportSelfReportEventV1,
  type LocalExportSelfReportValuesV1,
} from "./exportTypes";
import { validateLocalExportPackage } from "./importValidation";
import type { SelfReportEvent, SelfReportValues } from "../selfReports/selfReportTypes";

export type LocalImportApplyMode = "replace_local_data";

export type LocalImportApplyResult = {
  mode: LocalImportApplyMode;
  entries_restored: number;
  self_report_events_restored: number;
  self_report_days_recomputed: string[];
  self_report_aggregates_recomputed: number;
  queue_summaries_ignored: number;
  backend_calls_performed: false;
};

export type LocalImportApplyStorage = {
  replaceEntries: (entries: LocalEntry[]) => Promise<void>;
  replaceSelfReportEvents: (
    events: SelfReportEvent[],
  ) => Promise<ReplaceSelfReportEventsResult>;
};

const defaultStorage: LocalImportApplyStorage = {
  replaceEntries: replaceAllLocalEntries,
  replaceSelfReportEvents: replaceAllSelfReportEvents,
};

export async function applyLocalImportReplace(
  packageData: AthenaLocalExportV1,
  storage: LocalImportApplyStorage = defaultStorage,
): Promise<LocalImportApplyResult> {
  const validatedPackage = validateLocalExportPackage(packageData);

  const entries = validatedPackage.entries.map(toImportedLocalEntry);
  const selfReportEvents = validatedPackage.self_reports.events.map(
    toImportedSelfReportEvent,
  );

  await storage.replaceEntries(entries);
  const selfReportResult =
    await storage.replaceSelfReportEvents(selfReportEvents);

  return {
    mode: "replace_local_data",
    entries_restored: entries.length,
    self_report_events_restored: selfReportEvents.length,
    self_report_days_recomputed: selfReportResult.recomputedDays,
    self_report_aggregates_recomputed: selfReportResult.aggregates.length,
    queue_summaries_ignored: validatedPackage.queue.pending_jobs.length,
    backend_calls_performed: false,
  };
}

export function toImportedLocalEntry(
  entry: LocalExportEntryV1,
): LocalEntry {
  return {
    id: entry.id,
    serverId: entry.server_id,
    text: entry.text,
    entry_date: entry.entry_date,
    tags: entry.tags,
    analysis_enabled: entry.analysis_enabled,
    source_text_hash: entry.source_text_hash,
    signals: entry.signal,
    metadata: entry.metadata,
    sync_status: "local_only",
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

export function toImportedSelfReportEvent(
  event: LocalExportSelfReportEventV1,
): SelfReportEvent {
  return {
    id: event.id,
    entry_id: event.entry_id,
    local_day: event.local_day,
    created_at: event.created_at,
    updated_at: event.updated_at,
    values: toSelfReportValues(event.values),
    schema_version: EXPORT_SELF_REPORT_SCHEMA_VERSION,
    sync_status: "pending_sync",
  };
}

export function toSelfReportValues(
  values: LocalExportSelfReportValuesV1,
): SelfReportValues {
  return {
    mood: normalizeSelfReportValue(values.mood),
    stress: normalizeSelfReportValue(values.stress),
    energy: normalizeSelfReportValue(values.energy),
    sleep_quality: normalizeSelfReportValue(values.sleep_quality),
    function: normalizeSelfReportValue(values.function),
  };
}

function normalizeSelfReportValue(value: number | null) {
  if (value === null) return null;
  if (!Number.isFinite(value)) return null;

  return Math.max(0, Math.min(10, Math.round(value)));
}
