import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useAthenaApp } from "./app/useAthenaApp";
import { Editor } from "./components/Editor";
import { Nav } from "./components/Nav";
import { ServerAuthGate } from "./components/ServerAuthGate";
import { useServerAuth } from "./features/auth/useServerAuth";
import { VaultGate } from "./components/VaultGate";
import { useLocalVault } from "./features/vault/useLocalVault";
import {
  APP_LOCK_AUTO_LOCK_CHANGED_EVENT,
  getAppLockAutoLockDelayMs,
  getAppLockAutoLockPreference,
  getPrimaryVaultProfileId,
  isAppProtectionEnabled,
  setAppLockAutoLockPreference,
  type AppLockAutoLockPreference,
} from "./lib/appLock";
import { todayDateOnly } from "./lib/dates";
import type { VaultCredentialSummary } from "./lib/vault";
import logoImg from "./assets/logo-bg.jpg";

const EntriesPage = lazy(() =>
  import("./components/EntriesPage").then((module) => ({
    default: module.EntriesPage,
  })),
);
const Observations = lazy(() =>
  import("./components/Observations").then((module) => ({
    default: module.Observations,
  })),
);
const Settings = lazy(() =>
  import("./components/Settings").then((module) => ({
    default: module.Settings,
  })),
);

export default function App() {
  const serverAuth = useServerAuth();
  const vault = useLocalVault();
  const authPhase = serverAuth.phase;
  const vaultPhase = vault.phase;
  const lockVault = vault.lock;
  const setupVault = vault.setup;
  const unlockVaultWithoutSecret = vault.unlockWithoutSecret;
  const vaultCredentials = vault.credentials;
  const isVaultBusy = vault.isBusy;
  const appProtectionEnabled = isAppProtectionEnabled(vaultCredentials);
  const vaultProfileId = getPrimaryVaultProfileId(vaultCredentials);
  const [autoLockPreference, setAutoLockPreferenceState] = useState(() =>
    getAppLockAutoLockPreference(),
  );

  const changeAutoLockPreference = useCallback(
    (nextPreference: AppLockAutoLockPreference) => {
      setAppLockAutoLockPreference(nextPreference);
      setAutoLockPreferenceState(nextPreference);
    },
    [],
  );

  useEffect(() => {
    function handleAutoLockPreferenceChange() {
      setAutoLockPreferenceState(getAppLockAutoLockPreference());
    }

    window.addEventListener(
      APP_LOCK_AUTO_LOCK_CHANGED_EVENT,
      handleAutoLockPreferenceChange,
    );

    return () => {
      window.removeEventListener(
        APP_LOCK_AUTO_LOCK_CHANGED_EVENT,
        handleAutoLockPreferenceChange,
      );
    };
  }, []);

  useEffect(() => {
    if (
      authPhase !== "authenticated" &&
      authPhase !== "checking" &&
      vaultPhase === "unlocked"
    ) {
      lockVault();
    }
  }, [authPhase, lockVault, vaultPhase]);

  useEffect(() => {
    if (
      authPhase !== "authenticated" ||
      vaultPhase === "unlocked" ||
      isVaultBusy
    ) {
      return;
    }

    if (vaultPhase === "unconfigured") {
      void setupVault(vaultProfileId);
      return;
    }

    if (vaultPhase === "locked" && !appProtectionEnabled) {
      void unlockVaultWithoutSecret(vaultProfileId);
    }
  }, [
    appProtectionEnabled,
    authPhase,
    isVaultBusy,
    setupVault,
    unlockVaultWithoutSecret,
    vaultPhase,
    vaultProfileId,
  ]);

  if (serverAuth.isRequired && serverAuth.phase !== "authenticated") {
    return (
      <ServerAuthGate
        error={serverAuth.error}
        isBusy={serverAuth.isBusy}
        phase={serverAuth.phase}
        onLogin={serverAuth.login}
        onRetry={serverAuth.refresh}
        onSetup={serverAuth.setup}
      />
    );
  }

  if (vaultPhase !== "unlocked") {
    if (!appProtectionEnabled) {
      return null;
    }

    return (
      <VaultGate
        error={vault.error}
        isBusy={vault.isBusy}
        onUnlock={vault.unlock}
      />
    );
  }

  return (
    <AthenaWorkspace
      appProtectionEnabled={appProtectionEnabled}
      autoLockPreference={autoLockPreference}
      vaultCredentials={vaultCredentials}
      onAddVaultCredential={vault.addCredential}
      onChangeAutoLockPreference={changeAutoLockPreference}
      onDeleteVaultCredential={vault.deleteCredential}
      onLockVault={vault.lock}
      onRotateVaultSecret={vault.rotateSecret}
    />
  );
}

function AthenaWorkspace({
  appProtectionEnabled,
  autoLockPreference,
  vaultCredentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onDeleteVaultCredential,
  onLockVault,
  onRotateVaultSecret,
}: {
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
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
  onLockVault: () => void;
  onRotateVaultSecret: (input: {
    currentSecret: string;
    nextSecret: string;
    nextProfileId?: string;
    nextLabel?: string;
  }) => Promise<void>;
}) {
  const app = useAthenaApp();
  const { handlers } = app;

  const handleLockAthena = useCallback(async () => {
    if (!appProtectionEnabled) {
      return;
    }

    try {
      await handlers.prepareForVaultLock();
    } catch (error) {
      console.warn("[vault:prepare-lock]", error);
    } finally {
      onLockVault();
    }
  }, [appProtectionEnabled, handlers, onLockVault]);

  useEffect(() => {
    if (!appProtectionEnabled || autoLockPreference === "never") {
      return;
    }

    if (autoLockPreference === "on_hide") {
      function handleVisibilityChange() {
        if (document.visibilityState === "hidden") {
          void handleLockAthena();
        }
      }

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }

    const delayMs = getAppLockAutoLockDelayMs(autoLockPreference);

    if (!delayMs) {
      return;
    }

    const autoLockDelayMs = delayMs;
    let timeoutId = window.setTimeout(
      () => void handleLockAthena(),
      autoLockDelayMs,
    );
    const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart"];

    function refreshTimer() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(
        () => void handleLockAthena(),
        autoLockDelayMs,
      );
    }

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, refreshTimer, { passive: true });
    }

    return () => {
      window.clearTimeout(timeoutId);

      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, refreshTimer);
      }
    };
  }, [appProtectionEnabled, autoLockPreference, handleLockAthena]);

  return (
    <div className="relative h-screen overflow-hidden bg-[#f4efe6] text-zinc-950">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src={logoImg}
          alt=""
          className="
            absolute top-[-10%] right-[-10%]
            h-[120%] w-[120%] object-cover

            opacity-60 contrast-90 brightness-105

            [mask-image:radial-gradient(circle_at_70%_30%,black_35%,transparent_80%)]
            [-webkit-mask-image:radial-gradient(circle_at_70%_30%,black_35%,transparent_80%)]
          "
        />
      </div>
      <div className="flex h-full min-h-0">
        <Nav
          canLockAthena={appProtectionEnabled}
          currentPage={app.page}
          onLockAthena={() => void handleLockAthena()}
          onNavigate={(nextPage) => void handlers.navigate(nextPage)}
        />
        <main className="flex h-full min-w-0 flex-1 justify-center overflow-hidden px-4">
          {app.page === "editor" && (
            <Editor
              analysisEnabled={app.draftAnalysisEnabled}
              availableTags={app.availableEntryTags}
              editingEntryId={app.editingEntryId}
              entryDate={app.activeEntry?.entryDate ?? todayDateOnly()}
              editorInsight={app.editorInsight}
              personaTextEnabled={app.personaTextEnabled}
              tags={app.draftTags}
              text={app.draftText}
              onChangeTags={handlers.editorTagsChange}
              onChangeText={handlers.editorTextChange}
              onNewBlankPage={() => void handlers.newBlankPage()}
              onToggleAnalysisEnabled={handlers.toggleDraftAnalysisEnabled}
            />
          )}

          <Suspense fallback={null}>
            {app.page === "entries" && (
              <EntriesPage
                debugMode={app.debugMode}
                entries={app.visibleEntries}
                selectedEntry={app.selectedEntry}
                selectedEntryId={app.selectedEntryId}
                sortDirection={app.entrySortDirection}
                searchQuery={app.entrySearchQuery}
                includedTags={app.includedEntryTags}
                availableTags={app.availableEntryTags}
                hasActiveFilters={app.hasActiveEntryFilters}
                isSearching={app.isSearchingEntries}
                onChangeSortDirection={handlers.changeEntrySortDirection}
                onClearFilters={handlers.clearEntryFilters}
                onDeleteEntry={(entry) => void handlers.deleteEntry(entry)}
                onEditEntry={(entry) => void handlers.editEntry(entry)}
                onRefresh={() => void handlers.refreshEntries()}
                onSearchQueryChange={handlers.setEntrySearchQuery}
                onSelectEntry={handlers.selectEntry}
                onToggleEntryAnalysis={(entry) =>
                  void handlers.toggleEntryAnalysisEnabled(entry)
                }
                onToggleTag={handlers.toggleIncludedEntryTag}
              />
            )}

            {app.page === "observations" && (
              <Observations
                insights={app.observationHistory}
                personaTextEnabled={app.personaTextEnabled}
                onDeleteInsight={(insight) => void handlers.deleteInsight(insight)}
                onRefresh={() => void handlers.refreshObservationHistory()}
              />
            )}

            {app.page === "settings" && (
              <Settings
                appProtectionEnabled={appProtectionEnabled}
                autoLockPreference={autoLockPreference}
                debugMode={app.debugMode}
                isOnline={app.isOnline}
                entries={app.entries}
                extractionConfig={app.extractionConfig}
                extractionSettings={app.extractionSettings}
                extractionStatus={app.extractionStatus}
                localEmotionSpikeEnabled={app.localEmotionSpikeEnabled}
                localEmotionSpikeResult={app.localEmotionSpikeResult}
                localEmotionSpikeStatus={app.localEmotionSpikeStatus}
                personaTextEnabled={app.personaTextEnabled}
                reprocessMessage={app.reprocessMessage}
                reprocessStatus={app.reprocessStatus}
                queueSnapshot={app.queueSnapshot}
                vaultCredentials={vaultCredentials}
                onAddVaultCredential={onAddVaultCredential}
                onChangeAutoLockPreference={onChangeAutoLockPreference}
                onDeleteVaultCredential={onDeleteVaultCredential}
                onLockAthena={() => void handleLockAthena()}
                onRotateVaultSecret={onRotateVaultSecret}
                onChangeExtractionSettings={(settings) =>
                  void handlers.changeExtractionSettings(settings)
                }
                onClearLocalData={() => void handlers.clearLocalData()}
                onRefreshExtractionStatus={() =>
                  void handlers.refreshExtractionStatus(app.extractionSettings)
                }
                onReprocessFallbackEntries={() =>
                  void handlers.reprocessFallbackEntries()
                }
                onRetryRecoverableQueueJobs={() =>
                  void handlers.retryRecoverableQueueJobs()
                }
                onRunLocalEmotionSpikeDemo={() =>
                  void handlers.runLocalEmotionSpikeDemo()
                }
                onPauseQueue={handlers.pauseQueue}
                onStartQueue={handlers.startQueue}
                onToggleDebugMode={handlers.toggleDebugMode}
                onToggleLocalEmotionSpike={handlers.toggleLocalEmotionSpike}
                onTogglePersonaText={handlers.togglePersonaText}
              />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
