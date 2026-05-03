import { useEffect, useMemo, useRef, useState } from "react";
import type { EntrySortDirection, EntryView } from "../../types";
import { sortEntries } from "./entryState";
import {
  filterEntriesByTags,
  getAvailableTags,
  normalizeTag,
  pruneUnavailableTags,
} from "./entryFilters";
import { searchEntries } from "./entrySearch";

type UseEntrySearchInput = {
  entries: EntryView[];
  sortDirection: EntrySortDirection;
};

type UseEntrySearchResult = {
  query: string;
  setQuery: (query: string) => void;
  includedTags: string[];
  excludedTags: string[];
  availableTags: Array<{ tag: string; count: number }>;
  visibleEntries: EntryView[];
  isSearching: boolean;
  hasActiveFilters: boolean;
  toggleIncludedTag: (tag: string) => void;
  toggleExcludedTag: (tag: string) => void;
  clearFilters: () => void;
};

const SEARCH_DEBOUNCE_MS = 160;

export function useEntrySearch({
  entries,
  sortDirection,
}: UseEntrySearchInput): UseEntrySearchResult {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [includedTags, setIncludedTags] = useState<string[]>([]);
  const [excludedTags, setExcludedTags] = useState<string[]>([]);
  const [visibleEntries, setVisibleEntries] = useState<EntryView[]>(() =>
    sortEntries(entries, sortDirection),
  );
  const [isSearching, setIsSearching] = useState(false);
  const searchRunIdRef = useRef(0);

  const availableTags = useMemo(() => getAvailableTags(entries), [entries]);

  useEffect(() => {
    setIncludedTags((currentTags) => {
      const nextTags = pruneUnavailableTags(currentTags, availableTags);

      return nextTags.length === currentTags.length ? currentTags : nextTags;
    });

    setExcludedTags((currentTags) => {
      const nextTags = pruneUnavailableTags(currentTags, availableTags);

      return nextTags.length === currentTags.length ? currentTags : nextTags;
    });
  }, [availableTags]);

  const hasActiveFilters =
    query.trim().length > 0 ||
    includedTags.length > 0 ||
    excludedTags.length > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    const searchRunId = searchRunIdRef.current + 1;
    searchRunIdRef.current = searchRunId;

    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      const sortedEntries = sortEntries(entries, sortDirection);
      const tagFilteredEntries = filterEntriesByTags(
        sortedEntries,
        includedTags,
        excludedTags,
      );

      const nextVisibleEntries = debouncedQuery.trim()
        ? searchEntries(tagFilteredEntries, debouncedQuery).map(
            (result) => result.entry,
          )
        : tagFilteredEntries;

      if (searchRunIdRef.current === searchRunId) {
        setVisibleEntries(nextVisibleEntries);
        setIsSearching(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debouncedQuery, entries, excludedTags, includedTags, sortDirection]);

  function toggleIncludedTag(tag: string) {
    const normalizedTag = normalizeTag(tag);

    if (!normalizedTag) return;

    setIncludedTags((currentTags) => {
      const hasTag = currentTags.some(
        (currentTag) => normalizeTag(currentTag) === normalizedTag,
      );

      if (hasTag) {
        return currentTags.filter(
          (currentTag) => normalizeTag(currentTag) !== normalizedTag,
        );
      }

      return [...currentTags, tag];
    });
  }

  function toggleExcludedTag(tag: string) {
    const normalizedTag = normalizeTag(tag);

    if (!normalizedTag) return;

    setExcludedTags((currentTags) => {
      const hasTag = currentTags.some(
        (currentTag) => normalizeTag(currentTag) === normalizedTag,
      );

      if (hasTag) {
        return currentTags.filter(
          (currentTag) => normalizeTag(currentTag) !== normalizedTag,
        );
      }

      return [...currentTags, tag];
    });
  }

  function clearFilters() {
    setQuery("");
    setDebouncedQuery("");
    setIncludedTags([]);
    setExcludedTags([]);
  }

  return {
    query,
    setQuery,
    includedTags,
    excludedTags,
    availableTags,
    visibleEntries,
    isSearching,
    hasActiveFilters,
    toggleIncludedTag,
    toggleExcludedTag,
    clearFilters,
  };
}
