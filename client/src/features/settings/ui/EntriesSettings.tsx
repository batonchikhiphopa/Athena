import type {
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../../../shared/contracts";
import type { MessageKey } from "../../../i18n/messages";
import { useI18n } from "../../../i18n/useI18n";
import type {
  QueueJobStatus,
  QueueSnapshot,
} from "../../sync/queueTypes";
import {
  QueueStat,
  SettingsButton,
  SettingsRow,
  SettingsSection,
  SettingsSelect,
  SettingsLineLever,
} from "./settingsUi";

type EntriesSettingsProps = {
  canReprocess: boolean;
  debugMode: boolean;
  extractionSettings: ExtractionSettings;
  extractionStatus: ExtractionStatus | null;
  providers: ExtractionConfig["providers"];
  queueSnapshot: QueueSnapshot;
  reprocessCandidates: number;
  reprocessMessage: string;
  selectedProvider: ExtractionConfig["providers"][number];
  onChangeExtractionSettings: (value: ExtractionSettings) => void;
  onClearLocalData: () => void;
  onClearQueueHistory: () => void;
  onPauseQueue: () => void;
  onRefreshExtractionStatus: () => void;
  onReprocessFallbackEntries: () => void;
  onRetryRecoverableQueueJobs: () => void;
  onStartQueue: () => void;
  onToggleDebugMode: (value: boolean) => void;
};

type QueueErrorDetails = {
  code: string;
  message: string;
  kind: "retryable" | "blocked" | "conflict" | "cancelled" | "unknown";
};

export function EntriesSettings({
  canReprocess,
  debugMode,
  extractionSettings,
  extractionStatus,
  providers,
  queueSnapshot,
  reprocessCandidates,
  reprocessMessage,
  selectedProvider,
  onChangeExtractionSettings,
  onClearLocalData,
  onClearQueueHistory,
  onPauseQueue,
  onRefreshExtractionStatus,
  onReprocessFallbackEntries,
  onRetryRecoverableQueueJobs,
  onStartQueue,
  onToggleDebugMode,
}: EntriesSettingsProps) {
  const { language, t } = useI18n();
  const latestJob = queueSnapshot.latestJob;
  const visibleQueueError = latestJob?.last_error ?? queueSnapshot.lastError;
  const queueErrorDetails = parseQueueErrorDetails(visibleQueueError);
  const queueHint = queueErrorDetails
    ? formatQueueErrorHint(queueErrorDetails, t)
    : null;
  const queueProcessingState = formatQueueProcessingState(queueSnapshot, t);

  return (
    <div className="space-y-5">
      <SettingsSection label={t("settings.tab.records")}>
        <SettingsRow
          action={
          <SettingsLineLever
            checked={debugMode}
            label={t("settings.records.debugMode")}
            onChange={onToggleDebugMode}
          />
          }
          description={t("settings.records.debugDescription")}
          title={t("settings.records.debugMode")}
        />
      </SettingsSection>

      <SettingsSection label={t("settings.records.analysis")}>
        <SettingsRow
          action={
            <SettingsButton onClick={onRefreshExtractionStatus}>
              {t("settings.records.refreshStatus")}
            </SettingsButton>
          }
          description={formatStatus(extractionStatus, t)}
          title={t("settings.records.analysis")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                {t("settings.records.analysisSource")}
              </span>
              <SettingsSelect
                className="mt-2 w-full px-3 py-2 text-sm"
                onChange={(event) => {
                  const provider = event.target
                    .value as ExtractionSettings["provider"];
                  const option = providers.find((item) => item.id === provider);

                  onChangeExtractionSettings({
                    provider,
                    model: option?.defaultModel ?? extractionSettings.model,
                  });
                }}
                value={extractionSettings.provider}
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {formatProviderLabel(provider, t)}
                  </option>
                ))}
              </SettingsSelect>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                {t("settings.records.model")}
              </span>
              <SettingsSelect
                className="mt-2 w-full px-3 py-2 text-sm"
                onChange={(event) =>
                  onChangeExtractionSettings({
                    ...extractionSettings,
                    model: event.target.value,
                  })
                }
                value={extractionSettings.model}
              >
                {(selectedProvider?.models ?? [extractionSettings.model]).map(
                  (model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ),
                )}
              </SettingsSelect>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
            <div className="text-sm text-zinc-400">
              {t("settings.records.reprocessCount", {
                count: reprocessCandidates,
              })}
              {reprocessMessage ? ` · ${reprocessMessage}` : ""}
            </div>

            <SettingsButton
              disabled={!canReprocess}
              onClick={onReprocessFallbackEntries}
            >
              {t("settings.records.reprocess")}
            </SettingsButton>
          </div>
        </SettingsRow>
      </SettingsSection>

      {debugMode ? (
        <SettingsSection label={t("settings.records.queue")}>
          <SettingsRow
            description={t("settings.records.queueDescription")}
            title={t("settings.records.queue")}
          >
            <div className="grid grid-cols-2 gap-x-5 text-xs text-zinc-500 sm:grid-cols-3">
              <QueueStat
                label={t("settings.records.queueQueued")}
                value={queueSnapshot.queued}
              />
              <QueueStat
                label={t("settings.records.queueRunning")}
                value={queueSnapshot.running}
              />
              <QueueStat
                label={t("settings.records.queueFailed")}
                value={queueSnapshot.failed}
              />
              <QueueStat
                label={t("settings.records.queueBlocked")}
                value={queueSnapshot.blocked}
              />
              <QueueStat
                label={t("settings.records.queueCancelled")}
                value={queueSnapshot.cancelled}
              />
              <QueueStat
                label={t("settings.records.queueSucceeded")}
                value={queueSnapshot.succeeded}
              />
            </div>

          <div className="mt-3 text-xs text-zinc-400">
            {t("settings.records.queueProcessing")}:{" "}
            {queueProcessingState}
          </div>

          {latestJob ? (
            <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              <div className="flex flex-wrap items-center gap-2">
                <span>{t("settings.records.queueLatest")}:</span>
                <span className="font-mono text-zinc-700">{latestJob.type}</span>
                <QueueStatusBadge status={latestJob.status} t={t} />
                {latestJob.reason ? (
                  <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[11px] text-zinc-500">
                    {latestJob.reason}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 grid gap-1 text-[11px] text-zinc-400 sm:grid-cols-2">
                <div>
                  {t("settings.records.queueEntity")}:{" "}
                  <span className="font-mono text-zinc-500">
                    {latestJob.entity_id ?? "-"}
                  </span>
                </div>
                <div>
                  {t("settings.records.queueAttempts")}:{" "}
                  <span className="font-mono text-zinc-500">
                    {latestJob.attempts}/{latestJob.max_attempts}
                  </span>
                </div>
                <div>
                  {t("settings.records.queueUpdated")}:{" "}
                  <span className="font-mono text-zinc-500">
                    {formatDateTime(latestJob.updated_at, language)}
                  </span>
                </div>
                <div>
                  {t("settings.records.queueNextRetry")}:{" "}
                  <span className="font-mono text-zinc-500">
                    {latestJob.run_after ? formatDateTime(latestJob.run_after, language) : "-"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          {queueErrorDetails ? (
            <div className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-red-200 bg-white/70 px-2 py-0.5 font-mono text-[11px]">
                  {formatQueueErrorKind(queueErrorDetails.kind, t)}
                </span>
                <span className="font-mono">{queueErrorDetails.code}</span>
              </div>
              <div className="mt-1 text-red-800">{queueErrorDetails.message}</div>
              {queueHint ? (
                <div className="mt-1 text-red-500">{queueHint}</div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <SettingsButton onClick={onStartQueue} size="xs">
              {t("common.start")}
            </SettingsButton>
            <SettingsButton onClick={onPauseQueue} size="xs">
              {t("common.pause")}
            </SettingsButton>
            <SettingsButton
              disabled={queueSnapshot.failed + queueSnapshot.blocked === 0}
              onClick={onRetryRecoverableQueueJobs}
              size="xs"
            >
              {t("settings.records.queueRetryFailed")}
            </SettingsButton>
            <SettingsButton onClick={onClearQueueHistory} size="xs" variant="quiet">
              {t("settings.records.queueClearHistory")}
            </SettingsButton>
          </div>
          </SettingsRow>
        </SettingsSection>
      ) : null}

      <SettingsSection>
        <SettingsRow
          action={
            <SettingsButton onClick={onClearLocalData} variant="danger">
              {t("settings.records.deleteLocalData")}
            </SettingsButton>
          }
          title={t("settings.records.localData")}
          tone="danger"
        />
      </SettingsSection>
    </div>
  );
}

function QueueStatusBadge({
  status,
  t,
}: {
  status: QueueJobStatus;
  t: (key: MessageKey, values?: Record<string, string | number>) => string;
}) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${formatQueueStatusClass(
        status,
      )}`}
    >
      {formatQueueStatus(status, t)}
    </span>
  );
}

function formatQueueProcessingState(
  queueSnapshot: QueueSnapshot,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  if (queueSnapshot.isProcessing) return t("state.running");
  if (queueSnapshot.queued > 0 || queueSnapshot.running > 0) return t("state.paused");

  return t("state.idle");
}

function formatQueueStatusClass(status: QueueJobStatus) {
  if (status === "succeeded") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "failed" || status === "blocked") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "running") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "cancelled") {
    return "border-zinc-200 bg-zinc-100 text-zinc-500";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function formatQueueStatus(
  status: QueueJobStatus,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const keys = {
    blocked: "settings.records.queueBlocked",
    cancelled: "settings.records.queueCancelled",
    failed: "settings.records.queueFailed",
    queued: "settings.records.queueQueued",
    running: "settings.records.queueRunning",
    succeeded: "settings.records.queueSucceeded",
  } satisfies Record<QueueJobStatus, MessageKey>;

  return t(keys[status]);
}

function parseQueueErrorDetails(error: string | null): QueueErrorDetails | null {
  if (!error) return null;

  const [rawCode, ...messageParts] = error.split(":");
  const code = rawCode.trim();
  const message = messageParts.join(":").trim() || error;

  return {
    code,
    message,
    kind: classifyQueueErrorCode(code),
  };
}

function classifyQueueErrorCode(code: string): QueueErrorDetails["kind"] {
  if (
    code === "source_hash_mismatch" ||
    code === "backend_conflict" ||
    code === "stale_local_revision"
  ) {
    return "conflict";
  }

  if (
    code === "cancelled" ||
    code === "aborted" ||
    code === "vault_locked_cancelled"
  ) {
    return "cancelled";
  }

  if (
    code === "backend_unavailable" ||
    code === "network_error" ||
    code === "timeout" ||
    code === "rate_limited" ||
    code === "quota_error" ||
    code === "provider_unavailable" ||
    code === "provider_timeout" ||
    code === "gemini_daily_limit" ||
    code === "ollama_unavailable" ||
    code.startsWith("http_5")
  ) {
    return "retryable";
  }

  if (
    code === "validation_error" ||
    code === "schema_error" ||
    code === "privacy_boundary_violation" ||
    code === "missing_local_entry" ||
    code === "analysis_disabled" ||
    code === "vault_locked" ||
    code === "malformed_payload" ||
    code === "missing_handler" ||
    code.startsWith("http_4")
  ) {
    return "blocked";
  }

  return "unknown";
}

function formatQueueErrorHint(
  error: QueueErrorDetails,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
): string {
  if (error.kind === "retryable") {
    return t("settings.records.queueHintRetryable");
  }

  if (error.kind === "blocked") {
    return t("settings.records.queueHintBlocked");
  }

  if (error.kind === "conflict") {
    return t("settings.records.queueHintConflict");
  }

  if (error.kind === "cancelled") {
    return t("settings.records.queueHintCancelled");
  }

  return t("settings.records.queueHintUnknown");
}

function formatQueueErrorKind(
  kind: QueueErrorDetails["kind"],
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const keys = {
    blocked: "settings.records.queueKindBlocked",
    cancelled: "settings.records.queueKindCancelled",
    conflict: "settings.records.queueKindConflict",
    retryable: "settings.records.queueKindRetryable",
    unknown: "settings.records.queueKindUnknown",
  } satisfies Record<QueueErrorDetails["kind"], MessageKey>;

  return t(keys[kind]);
}

function formatDateTime(value: string, language: string): string {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return value;

  return new Date(timestamp).toLocaleString(language);
}

function formatStatus(
  status: ExtractionStatus | null,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  if (!status) return t("settings.status.unknown");
  if (status.available) {
    return `${status.provider} · ${status.model} · ${t("settings.status.ready")}`;
  }

  return `${status.provider} · ${status.model} · ${
    formatStatusReason(status.reason, t)
  }`;
}

function formatStatusReason(
  reason: string | null,
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const keys = {
    backend_unavailable: "settings.status.backend_unavailable",
    gemini_key_missing: "settings.status.gemini_key_missing",
    model_missing: "settings.status.model_missing",
    ollama_unavailable: "settings.status.ollama_unavailable",
    provider_off: "settings.status.provider_off",
  } satisfies Record<string, MessageKey>;

  if (reason && reason in keys) {
    return t(keys[reason as keyof typeof keys]);
  }

  return reason ?? t("settings.status.unavailable");
}

function formatProviderLabel(
  provider: ExtractionConfig["providers"][number],
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const keys = {
    gemini: "provider.gemini",
    off: "provider.off",
    ollama: "provider.ollama",
  } satisfies Record<ExtractionSettings["provider"], MessageKey>;

  return t(keys[provider.id]) || provider.label;
}
