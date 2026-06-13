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
import type { VaultProfile } from "../../../lib/vaultProfiles";
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
  activeVaultProfileId: string;
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
  vaultProfiles: VaultProfile[];
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
  onClose?: () => void;
  onCreateVaultProfile: () => void;
  onDeleteVaultProfile: (profileId: string) => Promise<boolean>;
  onLockAthena: () => void;
  onRenameVaultProfile: (profileId: string, name: string) => void;
  onSelectVaultProfile: (profileId: string) => void;
  onRotateVaultSecret: (input: {
    currentSecret: string;
    nextSecret: string;
    nextProfileId?: string;
    nextLabel?: string;
  }) => Promise<void>;
  onChangeExtractionSettings: (value: ExtractionSettings) => void;
  onClearLocalData: () => void;
  onClearQueueHistory: () => void;
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
  activeVaultProfileId,
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
  vaultProfiles,
  vaultCredentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onClose,
  onCreateVaultProfile,
  onDeleteVaultProfile,
  onDeleteVaultCredential,
  onLockAthena,
  onRenameVaultProfile,
  onSelectVaultProfile,
  onRotateVaultSecret,
  onChangeExtractionSettings,
  onClearLocalData,
  onClearQueueHistory,
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
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="shrink-0 px-5 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-[15px] font-medium text-zinc-900">
            {t("settings.title")}
          </h1>

          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="text-[11px] text-zinc-400">
                {t("common.offline")}
              </span>
            )}

            {onClose ? (
              <button
                aria-label={t("common.close")}
                className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                onClick={onClose}
                type="button"
              >
                <span className="translate-y-[-1px] text-base">×</span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3">
          <SettingsTabList activeTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>

<div
  className="settings-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 pr-3"
  data-no-drag
>
  
        {activeTab === "interface" ? (
          <InterfaceSettings
            personaTextEnabled={personaTextEnabled}
            onTogglePersonaText={onTogglePersonaText}
          />
        ) : null}

        {activeTab === "access" ? (
          <AccessSettings
            activeProfileId={activeVaultProfileId}
            appProtectionEnabled={appProtectionEnabled}
            autoLockPreference={autoLockPreference}
            credentials={vaultCredentials}
            profiles={vaultProfiles}
            onAddVaultCredential={onAddVaultCredential}
            onChangeAutoLockPreference={onChangeAutoLockPreference}
            onCreateProfile={onCreateVaultProfile}
            onDeleteProfile={onDeleteVaultProfile}
            onDeleteVaultCredential={onDeleteVaultCredential}
            onLockAthena={onLockAthena}
            onRenameProfile={onRenameVaultProfile}
            onSelectProfile={onSelectVaultProfile}
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
            onClearQueueHistory={onClearQueueHistory}
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
