import { useCallback, useEffect, useMemo, useState } from "react";
import type { EntryView, Page } from "../types";
import { deleteAthenaLocalData } from "../lib/storage";
import { useEditorDraft } from "../features/editor/useEditorDraft";
import { useEntries } from "../features/entries/useEntries";
import { useInsights } from "../features/insights/useInsights";
import { processPendingReextractEntries } from "../features/settings/pendingReextract";
import { useSettingsState } from "../features/settings/useSettingsState";
import { useSyncQueue } from "../features/sync/useSyncQueue";
import { useOnlineStatus } from "../lib/offline";

export function useAthenaApp() {
  const [page, setPage] = useState<Page>("editor");

  const entries = useEntries();

  const editor = useEditorDraft({
    clearSelectedEntry: () => entries.selectEntry(null),
    refreshEntries: entries.refreshEntries,
    selectEntry: entries.selectEntry,
  });

  const settings = useSettingsState();

  const insights = useInsights({
    draftLoaded: editor.draftLoaded,
    draftText: editor.draftText,
    personaTextEnabled: settings.personaTextEnabled,
  });

  const syncQueue = useSyncQueue({
    extractionSettings: settings.extractionSettings,
  });
  const initializeDraft = editor.initializeDraft;
  const refreshEntries = entries.refreshEntries;
  const refreshInsights = insights.refreshInsights;
  const refreshObservationHistory = insights.refreshObservationHistory;
  const initializeExtractionSettings = settings.initializeExtractionSettings;

  const activeEntry = useMemo(
    () =>
      entries.entries.find((entry) => entry.id === editor.editingEntryId) ??
      null,
    [editor.editingEntryId, entries.entries],
  );

  const isOnline = useOnlineStatus();

  const initialize = useCallback(async () => {
    try {
      const nextExtractionSettings = await initializeExtractionSettings();

      await initializeDraft();
      setPage("editor");

      // Sprint 3a.1 note:
      // Existing direct pending re-extraction flow is intentionally preserved.
      // The durable queue is initialized separately by useSyncQueue().
      // Actual extraction/reprocess queue integration comes later.
      await processPendingReextractEntries(nextExtractionSettings);

      await refreshEntries();
      await refreshInsights();
      await refreshObservationHistory();
    } catch (error) {
      console.error(error);
      await initializeDraft().catch((draftError) =>
        console.error("[editor:init]", draftError),
      );
    }
  }, [
    initializeDraft,
    initializeExtractionSettings,
    refreshEntries,
    refreshInsights,
    refreshObservationHistory,
  ]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function handleNewBlankPage() {
    await editor.newBlankPage();
    insights.clearEditorInsight();
    setPage("editor");
  }

  async function handleEditEntry(entry: EntryView) {
    await editor.editEntry(entry);
    insights.clearEditorInsight();
    setPage("editor");
  }

  async function handleDeleteEntry(entry: EntryView) {
    await entries.deleteEntry(entry);
    editor.clearIfEditingEntry(entry.id);
    await insights.refreshInsights();
    await insights.refreshObservationHistory();
  }

  async function handleNavigate(nextPage: Page) {
    if (nextPage !== "editor") {
      editor.clearAutosaveTimer();
      await editor.persistEditorText(editor.draftText);
    }

    setPage(nextPage);

    if (nextPage === "entries") {
      const activeEntryId = editor.activeEntryId();
      if (activeEntryId) entries.selectEntry(activeEntryId);
    }

    if (nextPage === "observations") {
      await insights.refreshObservationHistory();
    }
  }

  async function handleClearLocalData() {
    const confirmed = window.confirm(
      "Удалить локальные записи и черновик с этого устройства? Текст сервером не восстанавливается.",
    );

    if (!confirmed) return;

    await deleteAthenaLocalData();
    editor.resetAfterLocalDataClear();
    entries.resetEntries();
    settings.resetAfterLocalDataClear();
    await entries.refreshEntries();
    setPage("editor");
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
    availableEntryTags: entries.availableEntryTags,
    hasActiveEntryFilters: entries.hasActiveEntryFilters,
    isSearchingEntries: entries.isSearchingEntries,
    extractionConfig: settings.extractionConfig,
    extractionSettings: settings.extractionSettings,
    extractionStatus: settings.extractionStatus,
    insights: insights.insights,
    observationHistory: insights.observationHistory,
    page,
    personaTextEnabled: settings.personaTextEnabled,
    reprocessMessage: settings.reprocessMessage,
    reprocessStatus: settings.reprocessStatus,
    saveStatus: editor.saveStatus,
    selectedEntry: entries.selectedEntry,
    selectedEntryId: entries.selectedEntryId,
    visibleEntries: entries.visibleEntries,

    handlers: {
      changeEntrySortDirection: entries.changeEntrySortDirection,
      clearEntryFilters: entries.clearEntryFilters,
      changeExtractionSettings: settings.changeExtractionSettings,
      clearLocalData: handleClearLocalData,
      deleteEntry: handleDeleteEntry,
      deleteInsight: insights.deleteInsight,
      editEntry: handleEditEntry,
      editorTagsChange: editor.changeTags,
      editorTextChange: editor.changeText,
      navigate: handleNavigate,
      newBlankPage: handleNewBlankPage,
      refreshEntries: entries.refreshEntries,
      refreshExtractionStatus: settings.refreshExtractionStatus,
      refreshObservationHistory: insights.refreshObservationHistory,
      reprocessFallbackEntries: handleReprocessFallbackEntries,
      selectEntry: entries.selectEntry,
      setEntrySearchQuery: entries.setEntrySearchQuery,
      toggleDraftAnalysisEnabled: editor.toggleAnalysisEnabled,
      toggleEntryAnalysisEnabled: entries.toggleEntryAnalysisEnabled,
      toggleIncludedEntryTag: entries.toggleIncludedEntryTag,
      toggleDebugMode: settings.toggleDebugMode,
      togglePersonaText: settings.togglePersonaText,

      retryQueueJob: syncQueue.retry,
      cancelQueueJob: syncQueue.cancel,
      pauseQueue: syncQueue.pause,
      startQueue: syncQueue.start,
      retryRecoverableQueueJobs: syncQueue.retryRecoverable,
    },
  };
}