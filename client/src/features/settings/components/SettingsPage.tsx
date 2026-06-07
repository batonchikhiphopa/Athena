import { useState } from "react";
import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../../../types";
import type { QueueSnapshot } from "../../sync/queueTypes";
import { useI18n } from "../../../i18n/useI18n";
import { isSignalReprocessCandidate } from "../../sync/reprocessPolicy";
import type { LocalEmotionResult } from "../../emotion/localEmotion";
import type { AppLockAutoLockPreference } from "../../../lib/appLock";
import type { VaultCredentialSummary } from "../../vault/vaultApi";
import { AccessSettings } from "./AccessSettings";
import { DataSettings } from "./DataSettings";
import { InterfaceSettings } from "./InterfaceSettings";
import { EntriesSettings } from "./EntriesSettings";
import { SettingsTabList } from "./SettingsTabList";
import type { SettingsTab } from "./settingsTypes";

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
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
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
  vaultCredentials: VaultCredentialSummary[];
  onAddVaultCredential: (input: {
    authorizingSecret?: string;
    profileId: string;
    label: string;
    secret: string;
  }) => Promise<void>;
  onDeleteVaultCredential: (input: {
    authorizingSecret?: string;
    credentialId: string;
  }) => Promise<void>;
  onChangeAutoLockPreference: (value: AppLockAutoLockPreference) => void;
  onLockAthena: () => void;
  onRotateVaultSecret: (input: {
    currentSecret: string;
    nextSecret: string;
    nextProfileId?: string;
    nextLabel?: string;
  }) => Promise<void>;
  onChangeExtractionSettings: (value: ExtractionSettings) => void;
  onClearLocalData: () => void;
  onImportApplied: () => Promise<void>;
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

export function Settings({
  appProtectionEnabled,
  autoLockPreference,
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
  vaultCredentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onDeleteVaultCredential,
  onLockAthena,
  onRotateVaultSecret,
  onChangeExtractionSettings,
  onClearLocalData,
  onImportApplied,
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
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<SettingsTab>("interface");
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
        <div className="text-xs uppercase text-zinc-400">
          {t("settings.eyebrow")}
        </div>
        <h1 className="mt-2 text-2xl font-medium text-zinc-950">
          {t("settings.title")}
        </h1>
      </div>

      <div className="mb-4 rounded-2xl border border-zinc-200/70 bg-white/45 p-3 text-xs text-zinc-600">
        {t("settings.connection")}:{" "}
        {isOnline ? t("common.online") : t("common.offline")}
      </div>

      <SettingsTabList activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-4">
        {activeTab === "interface" ? (
          <InterfaceSettings
            personaTextEnabled={personaTextEnabled}
            onTogglePersonaText={onTogglePersonaText}
          />
        ) : null}

        {activeTab === "access" ? (
          <AccessSettings
            appProtectionEnabled={appProtectionEnabled}
            autoLockPreference={autoLockPreference}
            credentials={vaultCredentials}
            onAddVaultCredential={onAddVaultCredential}
            onChangeAutoLockPreference={onChangeAutoLockPreference}
            onDeleteVaultCredential={onDeleteVaultCredential}
            onLockAthena={onLockAthena}
            onRotateVaultSecret={onRotateVaultSecret}
          />
        ) : null}

        {activeTab === "records" ? (
          <EntriesSettings
            canReprocess={canReprocess}
            debugMode={debugMode}
            extractionSettings={extractionSettings}
            extractionStatus={extractionStatus}
            localEmotionSpikeEnabled={localEmotionSpikeEnabled}
            localEmotionSpikeResult={localEmotionSpikeResult}
            localEmotionSpikeStatus={localEmotionSpikeStatus}
            providers={providers}
            queueSnapshot={queueSnapshot}
            reprocessCandidates={reprocessCandidates}
            reprocessMessage={reprocessMessage}
            selectedProvider={selectedProvider}
            onChangeExtractionSettings={onChangeExtractionSettings}
            onClearLocalData={onClearLocalData}
            onPauseQueue={onPauseQueue}
            onRefreshExtractionStatus={onRefreshExtractionStatus}
            onReprocessFallbackEntries={onReprocessFallbackEntries}
            onRetryRecoverableQueueJobs={onRetryRecoverableQueueJobs}
            onRunLocalEmotionSpikeDemo={onRunLocalEmotionSpikeDemo}
            onStartQueue={onStartQueue}
            onToggleDebugMode={onToggleDebugMode}
            onToggleLocalEmotionSpike={onToggleLocalEmotionSpike}
          />
        ) : null}

        {activeTab === "data" ? (
          <DataSettings entries={entries} onImportApplied={onImportApplied} />
        ) : null}
      </div>
    </section>
  );
}