import { useRef, useState, type ChangeEvent } from "react";
import type { EntryView } from "../../entries/entryTypes";
import type { MessageKey } from "../../../i18n/messages";
import { useI18n } from "../../../i18n/useI18n";
import {
  getAllLocalEntries,
} from "../../entries/localEntryRepository";
import { getEntrySortDirection } from "../../entries/entryPreferences";
import {
  getExtractionSettings,
  getLocalEmotionSpikeEnabled,
  getPersonaTextEnabled,
} from "../settingsStorage";
import { getQueueJobs } from "../../sync/queueStorage";
import { getAllSelfReportEvents } from "../../selfReports/selfReportStorage";
import { buildLocalExportPackage } from "../../exportImport/exportPackage";
import {
  applyLocalImportReplace,
  type LocalImportApplyResult,
} from "../../exportImport/importApply";
import {
  parseAndValidateLocalExportJson,
} from "../../exportImport/importValidation";
import {
  buildLocalImportPreview,
  type LocalImportPreview,
} from "../../exportImport/importPreview";
import type { AthenaLocalExportV1 } from "../../exportImport/exportTypes";
import {
  SettingsButton,
  SettingsRow,
  SettingsSection,
} from "./settingsUi";

type DataSettingsProps = {
  entries: EntryView[];
  onImportApplied: () => Promise<void>;
};

type ImportPreviewState =
  | {
      status: "idle";
      fileName: null;
      error: null;
      preview: null;
      packageData: null;
      result: null;
    }
  | {
      status: "ready";
      fileName: string;
      error: null;
      preview: LocalImportPreview;
      packageData: AthenaLocalExportV1;
      result: null;
    }
  | {
      status: "applying";
      fileName: string;
      error: null;
      preview: LocalImportPreview;
      packageData: AthenaLocalExportV1;
      result: null;
    }
  | {
      status: "applied";
      fileName: string;
      error: null;
      preview: LocalImportPreview;
      packageData: AthenaLocalExportV1;
      result: LocalImportApplyResult;
    }
  | {
      status: "error";
      fileName: string | null;
      error: string;
      preview: null;
      packageData: null;
      result: null;
    };

export function DataSettings({ entries, onImportApplied }: DataSettingsProps) {
  const { language, t } = useI18n();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewState, setPreviewState] = useState<ImportPreviewState>({
    status: "idle",
    fileName: null,
    error: null,
    preview: null,
    packageData: null,
    result: null,
  });
  const [isReading, setIsReading] = useState(false);
  const [exportStatus, setExportStatus] = useState<
    | { state: "idle"; message: null }
    | { state: "running"; message: null }
    | { state: "done"; message: string }
    | { state: "error"; message: string }
  >({ state: "idle", message: null });

  async function handleExportLocalData() {
    setExportStatus({ state: "running", message: null });

    try {
      const extractionSettings = getExtractionSettings();
      const packageData = buildLocalExportPackage({
        appVersion: "0.8.3",
        entries: await getAllLocalEntries(),
        selfReportEvents: await getAllSelfReportEvents(),
        settings: {
          extraction_provider: extractionSettings?.provider,
          extraction_model: extractionSettings?.model,
          interface_language: language,
          entry_sort_direction: getEntrySortDirection(),
          persona_text_enabled: getPersonaTextEnabled(),
          local_emotion_spike_enabled: getLocalEmotionSpikeEnabled(),
        },
        queueJobs: await getQueueJobs(),
      });
      const filename = `athena-local-export-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")}.json`;
      const blob = new Blob([JSON.stringify(packageData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportStatus({
        state: "done",
        message: t("settings.data.exportDone", { filename }),
      });
    } catch (error) {
      setExportStatus({
        state: "error",
        message: formatImportError(error),
      });
    }
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    setIsReading(true);
    setPreviewState(createIdlePreviewState());

    try {
      const text = await file.text();
      const packageData = parseAndValidateLocalExportJson(text);
      const preview = buildLocalImportPreview(packageData, {
        entries: entries.map((entry) => ({ id: entry.id })),
      });

      setPreviewState({
        status: "ready",
        fileName: file.name,
        error: null,
        preview,
        packageData,
        result: null,
      });
    } catch (error) {
      setPreviewState({
        status: "error",
        fileName: file.name,
        error: formatImportError(error),
        preview: null,
        packageData: null,
        result: null,
      });
    } finally {
      setIsReading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleApplyImport() {
    if (previewState.status !== "ready") return;

    const confirmed = window.confirm(t("settings.data.confirmReplace"));

    if (!confirmed) return;

    const previousState = previewState;

    setPreviewState({
      ...previousState,
      status: "applying",
    });

    try {
      const result = await applyLocalImportReplace(previousState.packageData);
      await onImportApplied();

      setPreviewState({
        ...previousState,
        status: "applied",
        result,
      });
    } catch (error) {
      setPreviewState({
        status: "error",
        fileName: previousState.fileName,
        error: formatImportError(error),
        preview: null,
        packageData: null,
        result: null,
      });
    }
  }

  function handleClearPreview() {
    setPreviewState(createIdlePreviewState());
  }

  return (
    <div className="space-y-5">
      <SettingsSection label={t("settings.tab.data")}>
        <SettingsRow
          action={
            <SettingsButton
              data-testid="settings-data-export"
              disabled={exportStatus.state === "running"}
              onClick={() => void handleExportLocalData()}
            >
              {exportStatus.state === "running"
                ? t("common.wait")
                : t("settings.data.exportAction")}
            </SettingsButton>
          }
          description={t("settings.data.exportDescription")}
          title={t("settings.data.exportTitle")}
        >
          <div className="text-xs text-zinc-400">
            {t("settings.data.exportWarning")}
          </div>
          {exportStatus.message ? (
            <div
              aria-live="polite"
              className={`mt-3 rounded-md border px-3 py-2 text-xs ${
                exportStatus.state === "error"
                  ? "border-red-100 bg-red-50 text-red-700"
                  : "border-emerald-100 bg-emerald-50 text-emerald-800"
              }`}
              data-testid="settings-data-export-status"
            >
              {exportStatus.message}
            </div>
          ) : null}
        </SettingsRow>

        <SettingsRow
          description={t("settings.data.importDescription")}
          title={t("settings.data.importTitle")}
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950">
              <span>
                {isReading ? t("common.wait") : t("settings.data.chooseJson")}
              </span>
              <input
                ref={inputRef}
                accept="application/json,.json"
                aria-label={t("settings.data.fileInputLabel")}
                className="sr-only"
                data-testid="settings-data-import-file"
                disabled={isReading || previewState.status === "applying"}
                onChange={handleImportFileChange}
                type="file"
              />
            </label>

            {previewState.fileName ? (
              <div className="text-xs text-zinc-400">
                {t("settings.data.selectedFile")}:{" "}
                <span className="font-mono text-zinc-600">
                  {previewState.fileName}
                </span>
              </div>
            ) : (
              <div className="text-xs text-zinc-400">
                {t("settings.data.noFileSelected")}
              </div>
            )}
          </div>

          <div className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {t("settings.data.importPreviewOnly")}
          </div>

          {previewState.status === "error" ? (
            <div
              aria-live="polite"
              className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              <div className="font-medium">{t("settings.data.importError")}</div>
              <div className="mt-1">{previewState.error}</div>
              <div className="mt-1 text-red-500">
                {t("settings.data.noDataChanged")}
              </div>
            </div>
          ) : null}

          {previewState.status === "ready" ||
          previewState.status === "applying" ||
          previewState.status === "applied" ? (
            <ImportPreviewCard
              canApply={previewState.status === "ready"}
              isApplying={previewState.status === "applying"}
              preview={previewState.preview}
              result={previewState.result}
              onApply={handleApplyImport}
              onClear={handleClearPreview}
            />
          ) : null}
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}

function createIdlePreviewState(): ImportPreviewState {
  return {
    status: "idle",
    fileName: null,
    error: null,
    preview: null,
    packageData: null,
    result: null,
  };
}

function ImportPreviewCard({
  canApply,
  isApplying,
  preview,
  result,
  onApply,
  onClear,
}: {
  canApply: boolean;
  isApplying: boolean;
  preview: LocalImportPreview;
  result: LocalImportApplyResult | null;
  onApply: () => void;
  onClear: () => void;
}) {
  const { t } = useI18n();

  return (
    <div
      aria-live="polite"
      className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50/70 p-4"
      data-testid="settings-data-import-preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-800">
            {t("settings.data.previewTitle")}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {preview.export_version} · {formatDateTime(preview.exported_at)}
          </div>
        </div>

        <SettingsButton
          disabled={isApplying}
          onClick={onClear}
          size="xs"
          variant="quiet"
        >
          {t("common.close")}
        </SettingsButton>
      </div>

      <dl className="mt-4 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
        <PreviewStat
          label={t("settings.data.entriesCount")}
          value={preview.entries_count}
        />
        <PreviewStat
          label={t("settings.data.selfReportsCount")}
          value={preview.self_report_events_count}
        />
        <PreviewStat
          label={t("settings.data.dateRange")}
          value={formatDateRange(preview)}
        />
        <PreviewStat
          label={t("settings.data.currentLocalData")}
          value={formatCurrentLocalData(preview.current_local_data, t)}
        />
        <PreviewStat
          label={t("settings.data.duplicateEntries")}
          value={preview.possible_duplicate_entry_ids.length}
        />
        <PreviewStat
          label={t("settings.data.duplicateSelfReports")}
          value={preview.possible_duplicate_self_report_ids.length}
        />
      </dl>

      {preview.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-100 bg-white px-3 py-2 text-xs text-amber-800">
          <div className="font-medium">{t("settings.data.warnings")}</div>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {preview.warnings.map((warning) => (
              <li key={warning}>{formatPreviewWarning(warning, t)}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 rounded-md border border-zinc-100 bg-white px-3 py-2 text-xs text-zinc-500">
        <div>
          {t("settings.data.backendCalls")}:{" "}
          <span className="font-mono text-zinc-700">
            {preview.backend_calls_required ? "true" : "false"}
          </span>
        </div>
        <div className="mt-1">
          {t("settings.data.writesDuringPreview")}:{" "}
          <span className="font-mono text-zinc-700">
            {preview.writes_during_preview ? "true" : "false"}
          </span>
        </div>
        <div className="mt-1">
          {t("settings.data.importMode")}:{" "}
          <span className="font-mono text-zinc-700">{preview.mode}</span>
        </div>
      </div>

      {result ? <ImportResultCard result={result} /> : null}

      {!result ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SettingsButton
            data-testid="settings-data-import-apply"
            disabled={!canApply || isApplying}
            onClick={onApply}
            size="xs"
            variant="danger"
          >
            {isApplying
              ? t("settings.data.applying")
              : t("settings.data.confirmReplaceAction")}
          </SettingsButton>

          <div className="text-xs text-zinc-400">
            {t("settings.data.replaceExplanation")}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ImportResultCard({ result }: { result: LocalImportApplyResult }) {
  const { t } = useI18n();

  return (
    <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
      <div className="font-medium" data-testid="settings-data-import-result">
        {t("settings.data.importComplete")}
      </div>
      <dl className="mt-2 grid gap-1">
        <ResultRow
          label={t("settings.data.entriesRestored")}
          value={result.entries_restored}
        />
        <ResultRow
          label={t("settings.data.selfReportsRestored")}
          value={result.self_report_events_restored}
        />
        <ResultRow
          label={t("settings.data.selfReportDaysRecomputed")}
          value={result.self_report_days_recomputed.length}
        />
        <ResultRow
          label={t("settings.data.selfReportAggregatesRecomputed")}
          value={result.self_report_aggregates_recomputed}
        />
        <ResultRow
          label={t("settings.data.queueSummariesIgnored")}
          value={result.queue_summaries_ignored}
        />
        <ResultRow
          label={t("settings.data.backendCallsPerformed")}
          value={result.backend_calls_performed ? "true" : "false"}
        />
      </dl>
    </div>
  );
}

function PreviewStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-md border border-zinc-100 bg-white px-3 py-2">
      <dt className="uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-zinc-700">{value}</dd>
    </div>
  );
}

function ResultRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt>{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

function formatDateRange(preview: LocalImportPreview) {
  if (!preview.first_entry_date || !preview.last_entry_date) {
    return "-";
  }

  if (preview.first_entry_date === preview.last_entry_date) {
    return preview.first_entry_date;
  }

  return `${preview.first_entry_date} → ${preview.last_entry_date}`;
}

function formatCurrentLocalData(
  value: LocalImportPreview["current_local_data"],
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  if (value === "exists") return t("settings.data.currentDataExists");
  if (value === "empty") return t("settings.data.currentDataEmpty");
  return t("settings.data.currentDataUnknown");
}

function formatPreviewWarning(
  warning: string,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const messages: Record<string, string> = {
    local_export_contains_raw_diary_text: t("settings.data.warningRawText"),
    source_text_hash_is_fingerprint_metadata: t(
      "settings.data.warningSourceHash",
    ),
    replace_local_data_will_overwrite_current_browser_data: t(
      "settings.data.warningReplace",
    ),
    possible_duplicate_ids_found: t("settings.data.warningDuplicates"),
  };

  return messages[warning] ?? warning;
}

function formatDateTime(value: string) {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) return value;

  return new Date(timestamp).toLocaleString();
}

function formatImportError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown import error.";
}
