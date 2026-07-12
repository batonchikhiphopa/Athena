import { useMemo } from "react";
import { useI18n } from "../i18n/useI18n";
import type { EntryView } from "../features/entries/entryTypes";
import { deleteAthenaLocalData } from "./localData";
import { useAthenaLifecycle } from "./useAthenaLifecycle";
import { useAthenaNavigation } from "./useAthenaNavigation";
import { useVaultLockPreparation } from "./useVaultLockPreparation";
import { useEditorDraft } from "../features/editor/useEditorDraft";
import { useEntries } from "../features/entries/useEntries";
import { useInsights } from "../features/insights/useInsights";
import { useSettingsState } from "../features/settings/useSettingsState";
import { useSyncQueue } from "../features/sync/useSyncQueue";
import { useOnlineStatus } from "../shared/lib/offline";

export function useAthenaApp() {
  const { language, t } = useI18n();

  const entries = useEntries();

  const editor = useEditorDraft({
    clearSelectedEntry: () => entries.selectEntry(null),
    refreshEntries: entries.refreshEntries,
    selectEntry: entries.selectEntry,
  });

  const settings = useSettingsState(language);

  const insights = useInsights({
    draftLoaded: editor.draftLoaded,
    draftText: editor.draftText,
    personaTextEnabled: settings.personaTextEnabled,
  });

  const syncQueue = useSyncQueue({
    extractionSettings: settings.extractionSettings,
  });

  const navigation = useAthenaNavigation({
    editor,
    entries,
    insights,
    draftText: editor.draftText,
  });

  useAthenaLifecycle({
    initializeDraft: editor.initializeDraft,
    initializeExtractionSettings: settings.initializeExtractionSettings,
    refreshEntries: entries.refreshEntries,
    refreshInsights: insights.refreshInsights,
    refreshObservationHistory: insights.refreshObservationHistory,
    setPage: navigation.setPage,
  });

  const prepareForVaultLock = useVaultLockPreparation({
    clearAutosaveTimer: editor.clearAutosaveTimer,
    draftText: editor.draftText,
    persistEditorText: editor.persistEditorText,
  });

  const activeEntry = useMemo(
    () =>
      entries.entries.find((entry) => entry.id === editor.editingEntryId) ??
      null,
    [editor.editingEntryId, entries.entries],
  );

  const isOnline = useOnlineStatus();

  async function handleDeleteEntry(entry: EntryView) {
    await entries.deleteEntry(entry);
    editor.clearIfEditingEntry(entry.id);
    await insights.refreshInsights();
    await insights.refreshObservationHistory();
  }

  async function handleClearLocalData() {
    const confirmed = window.confirm(t("app.clearLocalDataConfirm"));

    if (!confirmed) return;

    await deleteAthenaLocalData();
    editor.resetAfterLocalDataClear();
    entries.resetEntries();
    settings.resetAfterLocalDataClear();
    await entries.refreshEntries();
    navigation.setPage("editor");
  }

  async function handleReprocessFallbackEntries() {
    await settings.reprocessFallbackEntries(entries.entries, {
      refreshEntries: entries.refreshEntries,
      refreshInsights: insights.refreshInsights,
      refreshObservationHistory: insights.refreshObservationHistory,
    });
  }

  return {
    isOnline,
    activeEntry,

    queueSnapshot: syncQueue.snapshot,

    debugMode: settings.debugMode,
    draftAnalysisEnabled: editor.draftAnalysisEnabled,
    draftStatus: editor.draftStatus,
    draftTags: editor.draftTags,
    draftText: editor.draftText,
    editorInsight: insights.editorInsight,
    editingEntryId: editor.editingEntryId,
    entries: entries.entries,
    entrySortDirection: entries.entrySortDirection,
    entrySearchQuery: entries.entrySearchQuery,
    includedEntryTags: entries.includedEntryTags,
    excludedEntryTags: entries.excludedEntryTags,
    availableEntryTags: entries.availableEntryTags,
    hasActiveEntryFilters: entries.hasActiveEntryFilters,
    isSearchingEntries: entries.isSearchingEntries,
    extractionConfig: settings.extractionConfig,
    extractionSettings: settings.extractionSettings,
    extractionStatus: settings.extractionStatus,
    localEmotionSpikeEnabled: settings.localEmotionSpikeEnabled,
    localEmotionSpikeResult: settings.localEmotionSpikeResult,
    localEmotionSpikeStatus: settings.localEmotionSpikeStatus,
    insights: insights.insights,
    observationHistory: insights.observationHistory,
    page: navigation.page,
    personaTextEnabled: settings.personaTextEnabled,
    reprocessMessage: settings.reprocessMessage,
    reprocessStatus: settings.reprocessStatus,
    saveStatus: editor.saveStatus,
    selectedEntryId: entries.selectedEntryId,
    visibleEntries: entries.visibleEntries,

    handlers: {
      changeEntrySortDirection: entries.changeEntrySortDirection,
      clearEntryFilters: entries.clearEntryFilters,
      changeExtractionSettings: settings.changeExtractionSettings,
      clearLocalData: handleClearLocalData,
      deleteEntry: handleDeleteEntry,
      deleteInsight: insights.deleteInsight,
      editEntry: navigation.handlers.editEntry,
      editorTagsChange: editor.changeTags,
      editorTextChange: editor.changeText,
      navigate: navigation.handlers.navigate,
      newBlankPage: navigation.handlers.newBlankPage,
      refreshEntries: entries.refreshEntries,
      refreshExtractionStatus: settings.refreshExtractionStatus,
      refreshObservationHistory: insights.refreshObservationHistory,
      reprocessFallbackEntries: handleReprocessFallbackEntries,
      runLocalEmotionSpikeDemo: settings.runLocalEmotionSpikeDemo,
      selectEntry: entries.selectEntry,
      setEntrySearchQuery: entries.setEntrySearchQuery,
      toggleDraftAnalysisEnabled: editor.toggleAnalysisEnabled,
      toggleEntryAnalysisEnabled: entries.toggleEntryAnalysisEnabled,
      toggleIncludedEntryTag: entries.toggleIncludedEntryTag,
      toggleExcludedEntryTag: entries.toggleExcludedEntryTag,
      toggleDebugMode: settings.toggleDebugMode,
      toggleLocalEmotionSpike: settings.toggleLocalEmotionSpike,
      togglePersonaText: settings.togglePersonaText,

      retryQueueJob: syncQueue.retry,
      cancelQueueJob: syncQueue.cancel,
      clearQueueHistory: syncQueue.clearHistory,
      pauseQueue: syncQueue.pause,
      prepareForVaultLock,
      startQueue: syncQueue.start,
      retryRecoverableQueueJobs: syncQueue.retryRecoverable,
    },
  };
}
