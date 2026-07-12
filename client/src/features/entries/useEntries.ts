import { useCallback, useEffect, useRef, useState } from "react";
import type { ServerEntry } from "../../shared/contracts";
import type { EntrySortDirection, EntryView } from "./entryTypes";
import {
  deleteServerEntry,
  loadServerEntries,
  loadServerEntry,
} from "./entriesApi";
import {
  deleteLocalEntry,
  getAllLocalEntries,
  updateLocalEntry,
} from "./localEntryRepository";
import {
  getEntrySortDirection,
  setEntrySortDirection as persistEntrySortDirection,
} from "./entryPreferences";
import { deleteEntrySelfReportAndSync } from "../selfReports/selfReportActions";
import { getAllSelfReportEvents } from "../selfReports/selfReportStorage";
import { mergeEntryState, mergeServerEntryIntoView } from "./entryState";
import { useEntrySearch } from "./useEntrySearch";

export function useEntries() {
  const [entries, setEntries] = useState<EntryView[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const selectedEntryIdRef = useRef<string | null>(null);
  const [entrySortDirection, setEntrySortDirection] =
    useState<EntrySortDirection>(() => getEntrySortDirection());

  const entrySearch = useEntrySearch({
    entries,
    sortDirection: entrySortDirection,
  });

  useEffect(() => {
    selectedEntryIdRef.current = selectedEntryId;
  }, [selectedEntryId]);

  const refreshServerEntryDetails = useCallback(
    async (entryId: string, sourceEntries: EntryView[]) => {
      const entry = sourceEntries.find((candidate) => candidate.id === entryId);
      if (!entry?.serverId) return;

      const serverEntry = await loadServerEntry(entry.serverId);
      if (!serverEntry) return;

      setEntries((currentEntries) =>
        currentEntries.map((currentEntry) =>
          currentEntry.id === entryId
            ? mergeServerEntryIntoView(currentEntry, serverEntry)
            : currentEntry,
        ),
      );
    },
    [],
  );

  const refreshEntries = useCallback(async () => {
    const localEntries = await getAllLocalEntries();
    const selfReports = await getAllSelfReportEvents().catch((error) => {
      console.warn("[entries:self-reports]", error);
      return [];
    });
    let serverEntries: ServerEntry[] = [];

    try {
      serverEntries = await loadServerEntries();
    } catch (error) {
      console.warn("[entries] backend unavailable:", error);
    }

    const localById = new Map(localEntries.map((entry) => [entry.id, entry]));
    const visibleServerEntries = serverEntries.filter((entry) =>
      localById.has(entry.client_entry_id),
    );
    const visibleServerByClientId = new Map(
      visibleServerEntries.map((entry) => [entry.client_entry_id, entry]),
    );
    const serverOnlyEntries = serverEntries.filter(
      (entry) => !localById.has(entry.client_entry_id),
    );

    if (serverOnlyEntries.length > 0) {
      void Promise.all(
        serverOnlyEntries.map((entry) =>
          deleteServerEntry(entry.id).catch((error) =>
            console.warn("[entries:delete-orphan]", error),
          ),
        ),
      );
    }

    const selfReportByEntryId = new Map(
      selfReports.map((report) => [report.entry_id, report]),
    );
    const merged = localEntries.map((localEntry) => ({
      ...mergeEntryState(
        localEntry,
        visibleServerByClientId.get(localEntry.id) ?? null,
      ),
      selfReport: selfReportByEntryId.get(localEntry.id) ?? null,
    }));

    const currentSelectedId = selectedEntryIdRef.current;
    const nextSelectedId =
      currentSelectedId && merged.some((entry) => entry.id === currentSelectedId)
        ? currentSelectedId
        : merged[0]?.id ?? null;

    setEntries(merged);
    setSelectedEntryId(nextSelectedId);
    selectedEntryIdRef.current = nextSelectedId;
    if (nextSelectedId) {
      void refreshServerEntryDetails(nextSelectedId, merged);
    }

    return merged;
  }, [refreshServerEntryDetails]);

  const deleteEntry = useCallback(
    async (entry: EntryView) => {
      await deleteLocalEntry(entry.id);
      await deleteEntrySelfReportAndSync(entry.id).catch((error) =>
        console.warn("[self-report:delete-entry]", error),
      );

      if (entry.serverId) {
        await deleteServerEntry(entry.serverId).catch((error) =>
          console.warn("[entry:delete-server]", error),
        );
      }

      setSelectedEntryId(null);
      selectedEntryIdRef.current = null;
      await refreshEntries();
    },
    [refreshEntries],
  );

  const toggleEntryAnalysisEnabled = useCallback(
    async (entry: EntryView) => {
      const nextAnalysisEnabled = !entry.analysisEnabled;
      const nextSyncStatus = nextAnalysisEnabled
        ? "pending_reextract"
        : "local_only";

      if (!nextAnalysisEnabled && entry.serverId) {
        await deleteServerEntry(entry.serverId).catch((error) =>
          console.warn("[entry:disable-analysis-server]", error),
        );
      }

      await updateLocalEntry(entry.id, {
        serverId: nextAnalysisEnabled ? entry.serverId : null,
        analysis_enabled: nextAnalysisEnabled,
        sync_status: nextSyncStatus,
      });

      await refreshEntries();
    },
    [refreshEntries],
  );

  function changeEntrySortDirection(nextValue: EntrySortDirection) {
    setEntrySortDirection(nextValue);
    persistEntrySortDirection(nextValue);
  }

  function resetEntries() {
    setEntries([]);
    setSelectedEntryId(null);
    selectedEntryIdRef.current = null;
    entrySearch.clearFilters();
  }

  function selectEntry(entryId: string | null) {
    setSelectedEntryId(entryId);
    selectedEntryIdRef.current = entryId;
    if (!entryId) return;

    void refreshServerEntryDetails(entryId, entries);
  }

  return {
    entries,
    entrySortDirection,
    selectedEntryId,
    visibleEntries: entrySearch.visibleEntries,

    entrySearchQuery: entrySearch.query,
    includedEntryTags: entrySearch.includedTags,
    excludedEntryTags: entrySearch.excludedTags,
    availableEntryTags: entrySearch.availableTags,
    hasActiveEntryFilters: entrySearch.hasActiveFilters,
    isSearchingEntries: entrySearch.isSearching,

    changeEntrySortDirection,
    clearEntryFilters: entrySearch.clearFilters,
    deleteEntry,
    refreshEntries,
    resetEntries,
    selectEntry,
    setEntrySearchQuery: entrySearch.setQuery,
    toggleEntryAnalysisEnabled,
    toggleIncludedEntryTag: entrySearch.toggleIncludedTag,
    toggleExcludedEntryTag: entrySearch.toggleExcludedTag,
  };
}
