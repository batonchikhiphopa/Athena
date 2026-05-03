import { useCallback, useMemo, useState } from "react";
import type { EntrySortDirection, EntryView, ServerEntry } from "../../types";
import { deleteServerEntry, loadServerEntries } from "../../lib/api";
import {
  deleteLocalEntry,
  getAllLocalEntries,
  getEntrySortDirection,
  setEntrySortDirection as persistEntrySortDirection,
  updateLocalEntry,
} from "../../lib/storage";
import { mergeEntryState } from "./entryState";
import { useEntrySearch } from "./useEntrySearch";

export function useEntries() {
  const [entries, setEntries] = useState<EntryView[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [entrySortDirection, setEntrySortDirection] =
    useState<EntrySortDirection>(() => getEntrySortDirection());

  const entrySearch = useEntrySearch({
    entries,
    sortDirection: entrySortDirection,
  });

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.id === selectedEntryId) ?? null,
    [entries, selectedEntryId],
  );

  const refreshEntries = useCallback(async () => {
    const localEntries = await getAllLocalEntries();
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

    const merged = localEntries.map((localEntry) =>
      mergeEntryState(
        localEntry,
        visibleServerEntries.find(
          (entry) => entry.client_entry_id === localEntry.id,
        ) ?? null,
      ),
    );

    setEntries(merged);
    setSelectedEntryId((current) => {
      if (current && merged.some((entry) => entry.id === current)) return current;
      return merged[0]?.id ?? null;
    });

    return merged;
  }, []);

  const deleteEntry = useCallback(
    async (entry: EntryView) => {
      await deleteLocalEntry(entry.id);

      if (entry.serverId) {
        await deleteServerEntry(entry.serverId).catch((error) =>
          console.warn("[entry:delete-server]", error),
        );
      }

      setSelectedEntryId(null);
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
    entrySearch.clearFilters();
  }

  return {
    entries,
    entrySortDirection,
    selectedEntry,
    selectedEntryId,
    visibleEntries: entrySearch.visibleEntries,

    entrySearchQuery: entrySearch.query,
    includedEntryTags: entrySearch.includedTags,
    availableEntryTags: entrySearch.availableTags,
    hasActiveEntryFilters: entrySearch.hasActiveFilters,
    isSearchingEntries: entrySearch.isSearching,

    changeEntrySortDirection,
    clearEntryFilters: entrySearch.clearFilters,
    deleteEntry,
    refreshEntries,
    resetEntries,
    selectEntry: setSelectedEntryId,
    setEntrySearchQuery: entrySearch.setQuery,
    toggleEntryAnalysisEnabled,
    toggleIncludedEntryTag: entrySearch.toggleIncludedTag,
  };
}
