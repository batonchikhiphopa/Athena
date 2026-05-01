import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../types";

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
  personaTextEnabled: boolean;
  isOnline: boolean;
  reprocessMessage: string;
  reprocessStatus: "idle" | "running" | "done" | "error";
  onChangeExtractionSettings: (value: ExtractionSettings) => void;
  onClearLocalData: () => void;
  onRefreshExtractionStatus: () => void;
  onReprocessFallbackEntries: () => void;
  onToggleDebugMode: (value: boolean) => void;
  onTogglePersonaText: (value: boolean) => void;
};

const statusLabels: Record<string, string> = {
  backend_unavailable: "backend unavailable",
  gemini_key_missing: "Gemini key missing",
  model_missing: "model missing",
  ollama_unavailable: "Ollama unavailable",
  provider_off: "off",
};

export function Settings({
  isOnline,
  debugMode,
  entries,
  extractionConfig,
  extractionSettings,
  extractionStatus,
  personaTextEnabled,
  reprocessMessage,
  reprocessStatus,
  onChangeExtractionSettings,
  onClearLocalData,
  onRefreshExtractionStatus,
  onReprocessFallbackEntries,
  onToggleDebugMode,
  onTogglePersonaText,
}: SettingsProps) {
  const providers = extractionConfig?.providers ?? fallbackProviders;
  const selectedProvider =
    providers.find((provider) => provider.id === extractionSettings.provider) ??
    providers[0];
  const fallbackCandidates = entries.filter(
    (entry) => entry.signals.signal_quality === "fallback" && entry.text,
  ).length;
  const canReprocess =
    fallbackCandidates > 0 && reprocessStatus !== "running";

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-8 py-8">
      <div className="mb-5">
        <div className="text-xs uppercase text-zinc-400">Настройки</div>
        <h1 className="mt-2 text-2xl font-medium text-zinc-950">Параметры</h1>
      </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-white/45 p-3 text-xs text-zinc-600">
              Network: {isOnline ? "online" : "offline"}
          </div>
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-zinc-950">
                AI extraction
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
              <span className="text-xs uppercase text-zinc-400">Provider</span>
              <select
                className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
                onChange={(event) => {
                  const provider = event.target.value as ExtractionSettings["provider"];
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
              <span className="text-xs uppercase text-zinc-400">Model</span>
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
              Fallback с локальным текстом: {fallbackCandidates}
              {reprocessMessage ? ` · ${reprocessMessage}` : ""}
            </div>
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canReprocess}
              onClick={onReprocessFallbackEntries}
              type="button"
            >
              Пересчитать fallback
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-sm font-medium text-zinc-950">Debug mode</div>
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
            Очистить локально
          </button>
        </div>
      </div>
    </section>
  );
}

function formatStatus(status: ExtractionStatus | null) {
  if (!status) return "status unknown";
  if (status.available) return `${status.provider} · ${status.model} · available`;

  return `${status.provider} · ${status.model} · ${
    statusLabels[status.reason ?? ""] ?? status.reason ?? "unavailable"
  }`;
}
