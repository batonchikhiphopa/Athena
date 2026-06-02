import { useState, type FormEvent } from "react";
import type {
  EntryView,
  ExtractionConfig,
  ExtractionSettings,
  ExtractionStatus,
} from "../types";
import type { QueueSnapshot } from "../lib/queueTypes";
import { useI18n } from "../i18n/useI18n";
import {
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type Language,
} from "../i18n/languages";
import type { MessageKey } from "../i18n/messages";
import { isSignalReprocessCandidate } from "../features/sync/reprocessPolicy";
import type { LocalEmotionResult } from "../features/emotion/localEmotion";
import {
  getPrimaryVaultProfileId,
  getProfileCredentials,
  isAppProtectionEnabled,
  type AppLockAutoLockPreference,
} from "../lib/appLock";
import {
  type VaultCredentialSummary,
} from "../lib/vault";
import { composeVaultSecret } from "../lib/vaultProfiles";

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

type SettingsTab = "interface" | "access" | "records";

const settingsTabs: { id: SettingsTab; label: MessageKey }[] = [
  { id: "interface", label: "settings.tab.interface" },
  { id: "access", label: "settings.tab.access" },
  { id: "records", label: "settings.tab.records" },
];

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
          <VaultAccessSettings
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
          <RecordsSettings
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
      </div>
    </section>
  );
}

function SettingsTabList({
  activeTab,
  onChange,
}: {
  activeTab: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-zinc-200 pb-2">
      {settingsTabs.map((tab) => (
        <button
          className={[
            "rounded-md px-3 py-2 text-sm transition",
            activeTab === tab.id
              ? "bg-zinc-950 text-white"
              : "text-zinc-500 hover:bg-white hover:text-zinc-950",
          ].join(" ")}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {t(tab.label)}
        </button>
      ))}
    </div>
  );
}

function InterfaceSettings({
  personaTextEnabled,
  onTogglePersonaText,
}: {
  personaTextEnabled: boolean;
  onTogglePersonaText: (value: boolean) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <LanguageSettings />

      <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.interface.personaTitle")}
          </div>
          <div className="mt-1 text-sm text-zinc-400">
            {t("settings.interface.personaDescription")}
          </div>
        </div>

        <input
          checked={personaTextEnabled}
          className="h-5 w-5 accent-zinc-950"
          onChange={(event) => onTogglePersonaText(event.target.checked)}
          type="checkbox"
        />
      </label>
    </>
  );
}

function LanguageSettings() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-zinc-950">
        {t("settings.interface.language")}
      </div>

      <label className="mt-4 block">
        <span className="text-xs uppercase text-zinc-400">
          {t("settings.interface.languageScope")}
        </span>
        <select
          className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
          onChange={(event) => setLanguage(event.target.value as Language)}
          value={language}
        >
          {SUPPORTED_LANGUAGES.map((option) => (
            <option key={option} value={option}>
              {LANGUAGE_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function VaultAccessSettings({
  appProtectionEnabled,
  autoLockPreference,
  credentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onDeleteVaultCredential,
  onLockAthena,
  onRotateVaultSecret,
}: {
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
  credentials: VaultCredentialSummary[];
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
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"idle" | "enable" | "disable" | "change">(
    "idle",
  );
  const [authorizingPassphrase, setAuthorizingPassphrase] = useState("");
  const [nextPassphrase, setNextPassphrase] = useState("");
  const [nextPassphraseConfirmation, setNextPassphraseConfirmation] =
    useState("");
  const [status, setStatus] = useState<{
    tone: "idle" | "ok" | "error";
    text: string;
  }>({ tone: "idle", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  const vaultProfileId = getPrimaryVaultProfileId(credentials);
  const profileCredentials = getProfileCredentials(credentials, vaultProfileId);
  const passwordCredentials = profileCredentials.filter(
    (credential) => credential.kind === "passphrase",
  );
  const passwordlessCredentials = profileCredentials.filter(
    (credential) => credential.kind === "passwordless",
  );
  const protectionEnabled =
    appProtectionEnabled && isAppProtectionEnabled(credentials);

  function getAuthorizingSecret() {
    return composeVaultSecret({
      profileId: vaultProfileId,
      passphrase: authorizingPassphrase,
    });
  }

  function resetForm() {
    setAuthorizingPassphrase("");
    setNextPassphrase("");
    setNextPassphraseConfirmation("");
  }

  function validateCurrentPassphrase() {
    if (authorizingPassphrase.length < 8) {
      setStatus({
        tone: "error",
        text: t("settings.access.status.passwordRequired"),
      });
      return false;
    }

    return true;
  }

  function validateNextPassphrase() {
    if (nextPassphrase.length < 8) {
      setStatus({
        tone: "error",
        text: t("settings.access.status.passwordTooShort"),
      });
      return false;
    }

    if (nextPassphrase !== nextPassphraseConfirmation) {
      setStatus({
        tone: "error",
        text: t("settings.access.status.passwordMismatch"),
      });
      return false;
    }

    return true;
  }

  async function handleEnableProtection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ tone: "idle", text: "" });

    if (!validateNextPassphrase()) {
      return;
    }

    setIsSaving(true);

    try {
      await onAddVaultCredential({
        profileId: vaultProfileId,
        label: t("settings.access.passwordLabelDefault"),
        secret: composeVaultSecret({
          profileId: vaultProfileId,
          passphrase: nextPassphrase,
        }),
      });

      for (const credential of profileCredentials) {
        await onDeleteVaultCredential({ credentialId: credential.id });
      }

      resetForm();
      setMode("idle");
      setStatus({ tone: "ok", text: t("settings.access.status.enableOk") });
    } catch {
      setStatus({
        tone: "error",
        text: t("settings.access.status.enableError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDisableProtection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ tone: "idle", text: "" });

    if (!validateCurrentPassphrase()) {
      return;
    }

    setIsSaving(true);

    try {
      for (const credential of passwordCredentials) {
        await onDeleteVaultCredential({
          authorizingSecret: getAuthorizingSecret(),
          credentialId: credential.id,
        });
      }

      resetForm();
      setMode("idle");
      setStatus({ tone: "ok", text: t("settings.access.status.disableOk") });
    } catch {
      setStatus({
        tone: "error",
        text: t("settings.access.status.disableError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ tone: "idle", text: "" });

    if (!validateCurrentPassphrase() || !validateNextPassphrase()) {
      return;
    }

    setIsSaving(true);

    try {
      await onRotateVaultSecret({
        currentSecret: getAuthorizingSecret(),
        nextSecret: composeVaultSecret({
          profileId: vaultProfileId,
          passphrase: nextPassphrase,
        }),
        nextProfileId: vaultProfileId,
        nextLabel: t("settings.access.passwordLabelDefault"),
      });

      resetForm();
      setMode("idle");
      setStatus({ tone: "ok", text: t("settings.access.status.rotateOk") });
    } catch {
      setStatus({
        tone: "error",
        text: t("settings.access.status.rotateError"),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <label className="flex cursor-pointer items-start justify-between gap-5">
        <div>
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.protectionTitle")}
          </div>
          <div className="mt-1 max-w-lg text-sm text-zinc-400">
            {t("settings.access.protectionDescription")}
          </div>
        </div>

        <input
          checked={protectionEnabled}
          className="mt-0.5 h-5 w-5 accent-zinc-950"
          disabled={isSaving}
          onChange={(event) => {
            setStatus({ tone: "idle", text: "" });
            resetForm();
            setMode(event.target.checked ? "enable" : "disable");
          }}
          type="checkbox"
        />
      </label>

      <div className="mt-4 text-xs text-zinc-400">
        {protectionEnabled
          ? t("settings.access.enabled")
          : t("settings.access.notEnabled")}
        {passwordlessCredentials.length > 0 && !protectionEnabled
          ? ` · ${t("settings.access.opensImmediately")}`
          : ""}
      </div>

      {protectionEnabled ? (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <label className="block">
            <span className="text-xs uppercase text-zinc-400">
              {t("settings.access.autoLock")}
            </span>
            <select
              className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
              onChange={(event) =>
                onChangeAutoLockPreference(
                  event.target.value as AppLockAutoLockPreference,
                )
              }
              value={autoLockPreference}
            >
              <option value="never">{t("settings.access.autoLockNever")}</option>
              <option value="on_hide">
                {t("settings.access.autoLockOnHide")}
              </option>
              <option value="1m">{t("settings.access.autoLock1m")}</option>
              <option value="5m">{t("settings.access.autoLock5m")}</option>
              <option value="15m">{t("settings.access.autoLock15m")}</option>
            </select>
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={() => {
                setStatus({ tone: "idle", text: "" });
                resetForm();
                setMode("change");
              }}
              type="button"
            >
              {t("settings.access.changePassword")}
            </button>
            <button
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950"
              onClick={onLockAthena}
              type="button"
            >
              {t("settings.access.lockNow")}
            </button>
          </div>
        </div>
      ) : null}

      {mode === "enable" ? (
        <form
          className="mt-5 border-t border-zinc-100 pt-4"
          onSubmit={(event) => void handleEnableProtection(event)}
        >
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.turnOn")}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.newPassword")}
              onChange={setNextPassphrase}
              value={nextPassphrase}
            />
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.repeat")}
              onChange={setNextPassphraseConfirmation}
              value={nextPassphraseConfirmation}
            />
          </div>
          <FormActions
            isSaving={isSaving}
            primaryLabel={t("settings.access.turnOn")}
            onCancel={() => {
              resetForm();
              setMode("idle");
            }}
          />
        </form>
      ) : null}

      {mode === "disable" ? (
        <form
          className="mt-5 border-t border-zinc-100 pt-4"
          onSubmit={(event) => void handleDisableProtection(event)}
        >
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.turnOff")}
          </div>
          <div className="mt-3 max-w-sm">
            <PasswordField
              autoComplete="current-password"
              label={t("settings.access.currentPassword")}
              onChange={setAuthorizingPassphrase}
              value={authorizingPassphrase}
            />
          </div>
          <FormActions
            isSaving={isSaving}
            primaryLabel={t("settings.access.turnOff")}
            onCancel={() => {
              resetForm();
              setMode("idle");
            }}
          />
        </form>
      ) : null}

      {mode === "change" ? (
        <form
          className="mt-5 border-t border-zinc-100 pt-4"
          onSubmit={(event) => void handleChangePassword(event)}
        >
          <div className="text-sm font-medium text-zinc-950">
            {t("settings.access.changePassword")}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PasswordField
              autoComplete="current-password"
              label={t("settings.access.currentPassword")}
              onChange={setAuthorizingPassphrase}
              value={authorizingPassphrase}
            />
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.newPassword")}
              onChange={setNextPassphrase}
              value={nextPassphrase}
            />
            <PasswordField
              autoComplete="new-password"
              label={t("settings.access.repeat")}
              onChange={setNextPassphraseConfirmation}
              value={nextPassphraseConfirmation}
            />
          </div>
          <FormActions
            isSaving={isSaving}
            primaryLabel={t("settings.access.changePassword")}
            onCancel={() => {
              resetForm();
              setMode("idle");
            }}
          />
        </form>
      ) : null}

      <StatusMessage status={status} />
    </div>
  );
}

function PasswordField({
  autoComplete,
  label,
  onChange,
  value,
}: {
  autoComplete: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase text-zinc-400">{label}</span>
      <input
        autoComplete={autoComplete}
        className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400"
        onChange={(event) => onChange(event.target.value)}
        type="password"
        value={value}
      />
    </label>
  );
}

function FormActions({
  isSaving,
  primaryLabel,
  onCancel,
}: {
  isSaving: boolean;
  primaryLabel: string;
  onCancel: () => void;
}) {
  const { t } = useI18n();

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-950 disabled:cursor-wait disabled:opacity-40"
        disabled={isSaving}
        type="submit"
      >
        {isSaving ? t("common.wait") : primaryLabel}
      </button>
      <button
        className="rounded-md border border-zinc-100 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-200 hover:text-zinc-700"
        disabled={isSaving}
        onClick={onCancel}
        type="button"
      >
        {t("common.close")}
      </button>
    </div>
  );
}

function RecordsSettings({
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
}: {
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
}) {
  const { t } = useI18n();

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

      {debugMode ? (
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

        {queueSnapshot.latestJob ? (
          <div className="mt-2 rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            {t("settings.records.queueLatest")}: {queueSnapshot.latestJob.type} ·{" "}
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

        {queueSnapshot.lastError ? (
          <div className="mt-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {queueSnapshot.lastError}
          </div>
        ) : null}
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

function StatusMessage({
  status,
}: {
  status: { tone: "idle" | "ok" | "error"; text: string };
}) {
  if (!status.text) return null;

  return (
    <div
      className={[
        "mt-4 text-xs",
        status.tone === "ok" ? "text-emerald-700" : "text-red-700",
      ].join(" ")}
    >
      {status.text}
    </div>
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
