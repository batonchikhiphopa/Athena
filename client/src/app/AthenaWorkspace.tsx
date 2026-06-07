import { lazy, Suspense, useCallback } from "react";
import { useAthenaApp } from "./useAthenaApp";
import { useAthenaAutoLock } from "./useAppAutoLock";
import { Editor } from "../components/Editor";
import { Nav } from "../components/Nav";
import type { VaultCredentialSummary } from "../features/vault/vaultApi";
import type { AppLockAutoLockPreference } from "../lib/appLock";
import { todayDateOnly } from "../lib/dates";
import logoImg from "../assets/logo-bg.jpg";

const EntriesPage = lazy(() =>
  import("../components/EntriesPage").then((module) => ({
    default: module.EntriesPage,
  })),
);
const Observations = lazy(() =>
  import("../components/Observations").then((module) => ({
    default: module.Observations,
  })),
);
const Settings = lazy(() =>
  import("../features/settings/components/SettingsPage").then((module) => ({
    default: module.Settings,
  })),
);

type AthenaWorkspaceProps = {
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
};

export function AthenaWorkspace({
  appProtectionEnabled,
  autoLockPreference,
  vaultCredentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onDeleteVaultCredential,
  onLockVault,
  onRotateVaultSecret,
}: AthenaWorkspaceProps) {
  const app = useAthenaApp();
  const { handlers } = app;

  const handleLockAthena = useCallback(() => {
    if (!appProtectionEnabled) {
      return;
    }

    void (async () => {
      try {
        await handlers.prepareForVaultLock();
      } catch (error) {
        console.warn("[vault:prepare-lock]", error);
      } finally {
        onLockVault();
      }
    })();
  }, [appProtectionEnabled, handlers, onLockVault]);

  useAthenaAutoLock({
    appProtectionEnabled,
    autoLockPreference,
    onLock: handleLockAthena,
  });

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

            [mask-image:radial-gradient(circle_at_70%_30%,black_45%,transparent_85%)]
            [-webkit-mask-image:radial-gradient(circle_at_70%_30%,black_35%,transparent_80%)]
          "
        />
      </div>
      <div className="flex h-full min-h-0">
        <Nav
          canLockAthena={appProtectionEnabled}
          currentPage={app.page}
          onLockAthena={handleLockAthena}
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
                excludedTags={app.excludedEntryTags}
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
                onToggleExcludedTag={handlers.toggleExcludedEntryTag}
                onToggleTag={handlers.toggleIncludedEntryTag}
              />
            )}

            {app.page === "observations" && (
              <Observations
                insights={app.observationHistory}
                personaTextEnabled={app.personaTextEnabled}
                onDeleteInsight={(insight) =>
                  void handlers.deleteInsight(insight)
                }
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
                onLockAthena={handleLockAthena}
                onRotateVaultSecret={onRotateVaultSecret}
                onChangeExtractionSettings={(settings) =>
                  void handlers.changeExtractionSettings(settings)
                }
                onClearLocalData={() => void handlers.clearLocalData()}
                onImportApplied={async () => {
                  await handlers.refreshEntries();
                }}
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
