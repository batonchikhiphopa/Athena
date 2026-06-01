import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../types";
import type { QueueSnapshot } from "../lib/queueTypes";
import { isSignalReprocessCandidate } from "../features/sync/reprocessPolicy";
import type { LocalEmotionResult } from "../features/emotion/localEmotion";

const fallbackProviders: ExtractionConfig["providers"] = [
  {
    id: "ollama",
    label: "Ollama local (privacy first)",
    defaultModel: "gpt-oss:20b",
    models: ["gpt-oss:20b"],
    configured: true,
  },
  {
    id: "gemini",
    label: "Gemini API",
    defaultModel: "gemini-2.5-flash-lite",
    models: ["gemini-2.5-flash-lite", "gemini-2.5-flash"],
    configured: false,
  },
  {
    id: "off",
    label: "Off",
    defaultModel: "fallback",
    models: ["fallback"],
    configured: true,
  },
];

type SettingsProps = {
  debugMode: boolean;
  entries: EntryView[];
  extractionConfig: ExtractionConfig | null;
  extractionSettings: ExtractionSettings;
  extractionStatus: ExtractionStatus | null;
  localEmotionSpikeEnabled: boolean;
  localEmotionSpikeResult: LocalEmotionResult | null;
  localEmotionSpikeStatus: "idle" | "running" | "done" | "error";
  personaTextEnabled: boolean;
  isOnline: boolean;
  queueSnapshot: QueueSnapshot;
  reprocessMessage: string;
  reprocessStatus: "idle" | "running" | "done" | "error";
  onChangeExtractionSettings: (value: ExtractionSettings) => void;
  onClearLocalData: () => void;
  onRefreshExtractionStatus: () => void;
  onReprocessFallbackEntries: () => void;
  onRetryRecoverableQueueJobs: () => void;
  onRunLocalEmotionSpikeDemo: () => void;
  onPauseQueue: () => void;
  onStartQueue: () => void;
  onToggleDebugMode: (value: boolean) => void;
  onToggleLocalEmotionSpike: (value: boolean) => void;
  onTogglePersonaText: (value: boolean) => void;
};

const statusLabels: Record<string, string> = {
  backend_unavailable: "сервис недоступен",
  gemini_key_missing: "не указан ключ Gemini",
  model_missing: "модель недоступна",
  ollama_unavailable: "Ollama не отвечает",
  provider_off: "анализ отключён",
};

export function Settings({
  isOnline,
  debugMode,
  entries,
  extractionConfig,
  extractionSettings,
  extractionStatus,
  localEmotionSpikeEnabled,
  localEmotionSpikeResult,
  localEmotionSpikeStatus,
  personaTextEnabled,
  queueSnapshot,
  reprocessMessage,
  reprocessStatus,
  onChangeExtractionSettings,
  onClearLocalData,
  onRefreshExtractionStatus,
  onReprocessFallbackEntries,
  onRetryRecoverableQueueJobs,
  onRunLocalEmotionSpikeDemo,
  onPauseQueue,
  onStartQueue,
  onToggleDebugMode,
  onToggleLocalEmotionSpike,
  onTogglePersonaText,
}: SettingsProps) {
  const providers = extractionConfig?.providers ?? fallbackProviders;
  const selectedProvider =
    providers.find((provider) => provider.id === extractionSettings.provider) ??
    providers[0];

  const reprocessCandidates = entries.filter(
    (entry) =>
      entry.text &&
      entry.analysisEnabled &&
      isSignalReprocessCandidate(entry.signals, entry.metadata),
  ).length;

  const canReprocess = reprocessCandidates > 0 && reprocessStatus !== "running";

  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col overflow-y-auto px-8 py-8">
      <div className="mb-5">
        <div className="text-xs uppercase text-zinc-400">Настройки</div>
        <h1 className="mt-2 text-2xl font-medium text-zinc-950">Параметры</h1>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200/70 bg-white/45 p-3 text-xs text-zinc-600">
        Подключение: {isOnline ? "в сети" : "не в сети"}
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-950">
                Анализ записей
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {formatStatus(extractionStatus)}
              </div>
            </div>

            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={onRefreshExtractionStatus}
              type="button"
            >
              Проверить
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase text-zinc-400">Источник анализа</span>
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
                    {provider.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs uppercase text-zinc-400">Модель</span>
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
              Записей для повторного анализа: {reprocessCandidates}
              {reprocessMessage ? ` · ${reprocessMessage}` : ""}
            </div>

            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canReprocess}
              onClick={onReprocessFallbackEntries}
              type="button"
            >
              Повторить анализ
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-zinc-950">Очередь обработки</div>
          <div className="mt-1 text-sm text-zinc-400">
            Локальные задачи, ожидающие обработки.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500 sm:grid-cols-3">
            <QueueStat label="в очереди" value={queueSnapshot.queued} />
            <QueueStat label="в работе" value={queueSnapshot.running} />
            <QueueStat label="с ошибкой" value={queueSnapshot.failed} />
            <QueueStat label="требуют внимания" value={queueSnapshot.blocked} />
            <QueueStat label="отменены" value={queueSnapshot.cancelled} />
            <QueueStat label="завершены" value={queueSnapshot.succeeded} />
          </div>

          <div className="mt-3 text-xs text-zinc-400">
            Обработка: {queueSnapshot.isProcessing ? "идёт" : "на паузе"}
          </div>

          {queueSnapshot.latestJob ? (
            <div className="mt-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
              Последняя задача: {queueSnapshot.latestJob.type} ·{" "}
              {queueSnapshot.latestJob.status}
              {queueSnapshot.latestJob.reason
                ? ` · ${queueSnapshot.latestJob.reason}`
                : ""}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={onStartQueue}
              type="button"
            >
              Запустить
            </button>
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={onPauseQueue}
              type="button"
            >
              Пауза
            </button>
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={queueSnapshot.failed + queueSnapshot.blocked === 0}
              onClick={onRetryRecoverableQueueJobs}
              type="button"
            >
              Повторить с ошибкой
            </button>
          </div>

          {queueSnapshot.lastError ? (
            <div className="mt-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {queueSnapshot.lastError}
            </div>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-sm font-medium text-zinc-950">Режим отладки</div>
            <div className="mt-1 text-sm text-zinc-400">
              Показывает внутренний слой в деталях записи.
            </div>
          </div>

          <input
            checked={debugMode}
            className="h-5 w-5 accent-zinc-950"
            onChange={(event) => onToggleDebugMode(event.target.checked)}
            type="checkbox"
          />
        </label>

        {debugMode && (
          <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-zinc-950">
                  Локальный анализ эмоций
                </div>
                <div className="mt-1 text-sm text-zinc-400">
                  Демо ONNX только в браузере. Итоговые метрики не меняются.
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
                Запустить демо
              </button>
              <div className="text-xs text-zinc-400">
                Статус: {localEmotionSpikeStatus}
              </div>
            </div>

            {localEmotionSpikeResult ? (
              <div className="mt-3 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-600">
                {formatEmotionSpikeResult(localEmotionSpikeResult)}
              </div>
            ) : null}
          </div>
        )}

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-sm font-medium text-zinc-950">
              Текст персоны
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              Показывает Athena-подсказки в пустом редакторе.
            </div>
          </div>

          <input
            checked={personaTextEnabled}
            className="h-5 w-5 accent-zinc-950"
            onChange={(event) => onTogglePersonaText(event.target.checked)}
            type="checkbox"
          />
        </label>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-zinc-950">
            Локальные данные
          </div>

          <button
            className="mt-4 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 transition hover:border-red-300 hover:bg-red-50"
            onClick={onClearLocalData}
            type="button"
          >
            Удалить данные с устройства
          </button>
        </div>
      </div>
    </section>
  );
}

function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2">
      <div className="uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 text-sm text-zinc-700">{value}</div>
    </div>
  );
}

function formatStatus(status: ExtractionStatus | null) {
  if (!status) return "Статус неизвестен";
  if (status.available) return `${status.provider} · ${status.model} · готово к анализу`;

  return `${status.provider} · ${status.model} · ${
    statusLabels[status.reason ?? ""] ?? status.reason ?? "недоступно"
  }`;
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
