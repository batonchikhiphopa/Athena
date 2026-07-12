import { lazy, Suspense, useCallback, useState } from "react";
import { useAthenaApp } from "./useAthenaApp";
import { useAthenaAutoLock } from "./useAppAutoLock";
import { Editor } from "../features/editor/ui/Editor";
import { Observations } from "../features/insights/ui/Observations";
import {
  FloatingLayerProvider,
  FloatingPanel,
  type FloatingPanelPosition,
} from "../components/floating";
import { Nav } from "../components/Nav";
import type { VaultCredentialSummary } from "../features/vault/vaultApi";
import { useI18n } from "../i18n/useI18n";
import type { AppLockAutoLockPreference } from "../features/vault/appLock";
import type { VaultProfile } from "../features/vault/vaultProfiles";
import { todayDateOnly } from "../shared/lib/dates";
import logoImg from "../assets/logo-bg.jpg";

const EntriesPage = lazy(() =>
  import("../features/entries/ui/EntriesPage").then((module) => ({
    default: module.EntriesPage,
  })),
);
const Settings = lazy(() =>
  import("../features/settings/ui/SettingsPage").then((module) => ({
    default: module.Settings,
  })),
);

const SETTINGS_PANEL_DEFAULT_POSITION: FloatingPanelPosition = {
  x: 112,
  y: 48,
};

const OBSERVATIONS_PANEL_DEFAULT_POSITION: FloatingPanelPosition = {
  x: 432,
  y: 72,
};

const settingsPanelStyle = {
  height: "min(42rem, calc(100vh - 2rem))",
  width: "min(46rem, calc(100vw - 2rem))",
};

const observationsPanelStyle = {
  height: "min(38rem, calc(100vh - 2rem))",
  width: "min(38rem, calc(100vw - 2rem))",
};

type AthenaWorkspaceProps = {
  activeVaultProfileId: string;
  appProtectionEnabled: boolean;
  autoLockPreference: AppLockAutoLockPreference;
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
  onCreateVaultProfile: () => void;
  onDeleteVaultProfile: (profileId: string) => Promise<boolean>;
  onLockVault: () => void;
  onRenameVaultProfile: (profileId: string, name: string) => void;
  onSelectVaultProfile: (profileId: string) => void;
  onRotateVaultSecret: (input: {
    currentSecret: string;
    nextSecret: string;
    nextProfileId?: string;
    nextLabel?: string;
  }) => Promise<void>;
};

export function AthenaWorkspace({
  activeVaultProfileId,
  appProtectionEnabled,
  autoLockPreference,
  vaultProfiles,
  vaultCredentials,
  onAddVaultCredential,
  onChangeAutoLockPreference,
  onCreateVaultProfile,
  onDeleteVaultProfile,
  onDeleteVaultCredential,
  onLockVault,
  onRenameVaultProfile,
  onSelectVaultProfile,
  onRotateVaultSecret,
}: AthenaWorkspaceProps) {
  const app = useAthenaApp();
  const { t } = useI18n();
  const { handlers } = app;
  const [isObservationsOpen, setIsObservationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  function handleOpenObservations() {
    setIsObservationsOpen(true);
    void handlers.refreshObservationHistory();
  }

  function handleRefreshObservations() {
    void handlers.refreshObservationHistory();
  }

  return (
    <FloatingLayerProvider>
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
            isSettingsOpen={isSettingsOpen}
            onLockAthena={handleLockAthena}
            onNavigate={(nextPage) => void handlers.navigate(nextPage)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <main
            className={[
              "flex h-full min-w-0 flex-1 justify-center px-4",
              app.page === "entries"
                ? "athena-page-scroll overflow-y-auto"
                : "overflow-hidden",
            ].join(" ")}
          >
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
                  selectedEntryId={app.selectedEntryId}
                  sortDirection={app.entrySortDirection}
                  searchQuery={app.entrySearchQuery}
                  includedTags={app.includedEntryTags}
                  excludedTags={app.excludedEntryTags}
                  hasActiveFilters={app.hasActiveEntryFilters}
                  isSearching={app.isSearchingEntries}
                  onChangeSortDirection={handlers.changeEntrySortDirection}
                  onClearFilters={handlers.clearEntryFilters}
                  onDeleteEntry={(entry) => void handlers.deleteEntry(entry)}
                  onEditEntry={(entry) => void handlers.editEntry(entry)}
                  onOpenObservations={handleOpenObservations}
                  onSearchQueryChange={handlers.setEntrySearchQuery}
                  onSelectEntry={handlers.selectEntry}
                  onToggleEntryAnalysis={(entry) =>
                    void handlers.toggleEntryAnalysisEnabled(entry)
                  }
                  onToggleExcludedTag={handlers.toggleExcludedEntryTag}
                  onToggleTag={handlers.toggleIncludedEntryTag}
                />
              )}

            </Suspense>
          </main>

          <Suspense fallback={null}>
            <FloatingPanel
              aria-label={t("nav.observations")}
              className="
                overflow-hidden rounded-lg border border-white/25 bg-white/55
                text-zinc-800 shadow-2xl shadow-zinc-900/10
                backdrop-blur-md
              "
              defaultPosition={OBSERVATIONS_PANEL_DEFAULT_POSITION}
              id="observations"
              isOpen={isObservationsOpen}
              onClose={() => setIsObservationsOpen(false)}
              style={observationsPanelStyle}
              testId="observations-floating-panel"
            >
              <Observations
                insights={app.observationHistory}
                personaTextEnabled={app.personaTextEnabled}
                onClose={() => setIsObservationsOpen(false)}
                onDeleteInsight={(insight) =>
                  void handlers.deleteInsight(insight)
                }
                onRefresh={handleRefreshObservations}
              />
            </FloatingPanel>

            <FloatingPanel
              aria-label={t("nav.settings")}
              className="
                overflow-hidden rounded-lg border border-white/25 bg-white/55
                text-zinc-800 shadow-2xl shadow-zinc-900/10
                backdrop-blur-md
              "
              defaultPosition={SETTINGS_PANEL_DEFAULT_POSITION}
              id="settings"
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              style={settingsPanelStyle}
              testId="settings-floating-panel"
            >
              <Settings
                appProtectionEnabled={appProtectionEnabled}
                autoLockPreference={autoLockPreference}
                activeVaultProfileId={activeVaultProfileId}
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
                vaultProfiles={vaultProfiles}
                vaultCredentials={vaultCredentials}
                onAddVaultCredential={onAddVaultCredential}
                onChangeAutoLockPreference={onChangeAutoLockPreference}
                onClose={() => setIsSettingsOpen(false)}
                onCreateVaultProfile={onCreateVaultProfile}
                onDeleteVaultProfile={onDeleteVaultProfile}
                onDeleteVaultCredential={onDeleteVaultCredential}
                onLockAthena={handleLockAthena}
                onRenameVaultProfile={onRenameVaultProfile}
                onSelectVaultProfile={onSelectVaultProfile}
                onRotateVaultSecret={onRotateVaultSecret}
                onChangeExtractionSettings={(settings) =>
                  void handlers.changeExtractionSettings(settings)
                }
                onClearLocalData={() => void handlers.clearLocalData()}
                onClearQueueHistory={() => void handlers.clearQueueHistory()}
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
            </FloatingPanel>
          </Suspense>
        </div>
      </div>
    </FloatingLayerProvider>
  );
}
