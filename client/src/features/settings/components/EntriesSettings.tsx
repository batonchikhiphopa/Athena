import type {
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../../../types";
import type { MessageKey } from "../../../i18n/messages";
import { useI18n } from "../../../i18n/useI18n";
import type { LocalEmotionResult } from "../../emotion/localEmotion";
import type {
  QueueJobStatus,
  QueueSnapshot,
} from "../../../lib/queueTypes";
import { QueueStat } from "./settingsUi";

type EntriesSettingsProps = {
  canReprocess: boolean;
  debugMode: boolean;
  extractionSettings: ExtractionSettings;
  extractionStatus: ExtractionStatus | null;
  localEmotionSpikeEnabled: boolean;
  localEmotionSpikeResult: LocalEmotionResult | null;
  localEmotionSpikeStatus: "idle" | "running" | "done" | "error";
  providers: ExtractionConfig["providers"];
  queueSnapshot: QueueSnapshot;
  reprocessCandidates: number;
  reprocessMessage: string;
  selectedProvider: ExtractionConfig["providers"][number];
  onChangeExtractionSettings: (value: ExtractionSettings) => void;
  onClearLocalData: () => void;
  onPauseQueue: () => void;
  onRefreshExtractionStatus: () => void;
  onReprocessFallbackEntries: () => void;
  onRetryRecoverableQueueJobs: () => void;
  onRunLocalEmotionSpikeDemo: () => void;
  onStartQueue: () => void;
  onToggleDebugMode: (value: boolean) => void;
  onToggleLocalEmotionSpike: (value: boolean) => void;
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
  localEmotionSpikeEnabled,
  localEmotionSpikeResult,
  localEmotionSpikeStatus,
  providers,
  queueSnapshot,
  reprocessCandidates,
  reprocessMessage,
  selectedProvider,
  onChangeExtractionSettings,
  onClearLocalData,
  onPauseQueue,
  onRefreshExtractionStatus,
  onReprocessFallbackEntries,
  onRetryRecoverableQueueJobs,
  onRunLocalEmotionSpikeDemo,
  onStartQueue,
  onToggleDebugMode,
  onToggleLocalEmotionSpike,
}: EntriesSettingsProps) {
  const { language, t } = useI18n();
  const localEmotionSpikeAvailable = language === "ru";
  const latestJob = queueSnapshot.latestJob;
  const visibleQueueError = latestJob?.last_error ?? queueSnapshot.lastError;
  const queueErrorDetails = parseQueueErrorDetails(visibleQueueError);
  const queueHint = queueErrorDetails
    ? formatQueueErrorHint(queueErrorDetails, language)
    : null;

  return (
    <>
      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.records.debugMode")}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            {t("settings.records.debugDescription")}
          </div>
        </div>

        <input
          checked={debugMode}
          className="h-5 w-5 accent-zinc-950"
          onChange={(event) => onToggleDebugMode(event.target.checked)}
          type="checkbox"
        />
      </label>

      {debugMode && localEmotionSpikeAvailable ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-950">
                {t("settings.records.localEmotionTitle")}
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {t("settings.records.localEmotionDescription")}
              </div>
            </div>

            <input
              checked={localEmotionSpikeEnabled}
              className="h-5 w-5 accent-zinc-950"
              onChange={(event) =>
                onToggleLocalEmotionSpike(event.target.checked)
              }
              type="checkbox"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={localEmotionSpikeStatus === "running"}
              onClick={onRunLocalEmotionSpikeDemo}
              type="button"
            >
              {t("settings.records.runDemo")}
            </button>
            <div className="text-xs text-zinc-400">
              {t("common.status")}: {formatRunStatus(localEmotionSpikeStatus, t)}
            </div>
          </div>

          {localEmotionSpikeResult ? (
            <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600">
              {formatEmotionSpikeResult(localEmotionSpikeResult)}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-zinc-950">
              {t("settings.records.analysis")}
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              {formatStatus(extractionStatus, t)}
            </div>
          </div>

          <button
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            onClick={onRefreshExtractionStatus}
            type="button"
          >
            {t("settings.records.refreshStatus")}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase text-zinc-400">
              {t("settings.records.analysisSource")}
            </span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
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
            </select>
          </label>

          <label className="block">
            <span className="text-xs uppercase text-zinc-400">
              {t("settings.records.model")}
            </span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
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
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <div className="text-sm text-zinc-400">
            {t("settings.records.reprocessCount", {
              count: reprocessCandidates,
            })}
            {reprocessMessage ? ` · ${reprocessMessage}` : ""}
          </div>

          <button
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canReprocess}
            onClick={onReprocessFallbackEntries}
            type="button"
          >
            {t("settings.records.reprocess")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-zinc-950">
          {t("settings.records.queue")}
        </div>
        <div className="mt-1 text-sm text-zinc-400">
          {t("settings.records.queueDescription")}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500 sm:grid-cols-3">
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
          {queueSnapshot.isProcessing ? t("state.running") : t("state.paused")}
        </div>

        {latestJob ? (
          <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            <div className="flex flex-wrap items-center gap-2">
              <span>{t("settings.records.queueLatest")}:</span>
              <span className="font-mono text-zinc-700">{latestJob.type}</span>
              <QueueStatusBadge status={latestJob.status} />
              {latestJob.reason ? (
                <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 font-mono text-[11px] text-zinc-500">
                  {latestJob.reason}
                </span>
              ) : null}
            </div>

            <div className="mt-2 grid gap-1 text-[11px] text-zinc-400 sm:grid-cols-2">
              <div>
                entity:{" "}
                <span className="font-mono text-zinc-500">
                  {latestJob.entity_id ?? "-"}
                </span>
              </div>
              <div>
                attempts:{" "}
                <span className="font-mono text-zinc-500">
                  {latestJob.attempts}/{latestJob.max_attempts}
                </span>
              </div>
              <div>
                updated:{" "}
                <span className="font-mono text-zinc-500">
                  {formatDateTime(latestJob.updated_at)}
                </span>
              </div>
              <div>
                next retry:{" "}
                <span className="font-mono text-zinc-500">
                  {latestJob.run_after ? formatDateTime(latestJob.run_after) : "-"}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {queueErrorDetails ? (
          <div className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-red-200 bg-white/70 px-2 py-0.5 font-mono text-[11px]">
                {queueErrorDetails.kind}
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
          <button
            className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            onClick={onStartQueue}
            type="button"
          >
            {t("common.start")}
          </button>
          <button
            className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
            onClick={onPauseQueue}
            type="button"
          >
            {t("common.pause")}
          </button>
          <button
            className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={queueSnapshot.failed + queueSnapshot.blocked === 0}
            onClick={onRetryRecoverableQueueJobs}
            type="button"
          >
            {t("settings.records.queueRetryFailed")}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-zinc-950">
          {t("settings.records.localData")}
        </div>

        <button
          className="mt-4 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:border-red-300 hover:bg-red-50"
          onClick={onClearLocalData}
          type="button"
        >
          {t("settings.records.deleteLocalData")}
        </button>
      </div>
    </>
  );
}

function QueueStatusBadge({ status }: { status: QueueJobStatus }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] ${formatQueueStatusClass(
        status,
      )}`}
    >
      {status}
    </span>
  );
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
  language: string,
): string {
  const ru = language === "ru";

  if (error.kind === "retryable") {
    return ru
      ? "Похоже на временный сбой. Очередь попробует позже или после ручного retry."
      : "This looks temporary. The queue can retry later or after manual retry.";
  }

  if (error.kind === "blocked") {
    return ru
      ? "Автоповтор остановлен: нужно новое локальное действие или исправление payload/state."
      : "Automatic retry is stopped: a new local action or payload/state fix is needed.";
  }

  if (error.kind === "conflict") {
    return ru
      ? "Конфликт не скрывается: локальная запись считается источником правды."
      : "Conflict is explicit: the local entry remains the source of truth.";
  }

  if (error.kind === "cancelled") {
    return ru ? "Job был отменён." : "The job was cancelled.";
  }

  return ru
    ? "Неизвестный тип ошибки. Смотри код и latest job."
    : "Unknown error kind. Check the code and latest job.";
}

function formatDateTime(value: string): string {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) return value;

  return new Date(timestamp).toLocaleString();
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

function formatRunStatus(
  status: "idle" | "running" | "done" | "error",
  t: (key: MessageKey, values?: Record<string, string | number>) => string,
) {
  const keys = {
    done: "state.done",
    error: "state.error",
    idle: "state.idle",
    running: "state.running",
  } satisfies Record<typeof status, MessageKey>;

  return t(keys[status]);
}

function formatEmotionSpikeResult(result: LocalEmotionResult) {
  if (!result.ok) {
    return `${result.reason}: ${result.message.slice(0, 160)}`;
  }

  const labels = Object.entries(result.signals.labels)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, score]) => `${label} ${score}`)
    .join(", ");

  return [
    result.signals.model,
    `top=${result.signals.top_label ?? "-"} ${result.signals.top_score ?? "-"}`,
    `load=${result.signals.timings_ms.model_load}ms`,
    `infer=${result.signals.timings_ms.inference}ms`,
    labels,
  ].join(" · ");
}