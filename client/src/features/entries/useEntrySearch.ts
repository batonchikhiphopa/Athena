import { useEffect, useMemo, useRef, useState } from "react";
import type { EntrySortDirection, EntryView } from "../../types";
import { sortEntries } from "./entryState";
import {
  getAvailableTags,
  normalizeTag,
  pruneUnavailableTags,
} from "./entryFilters";
import {
  createEntrySearchIndex,
  searchIndexedEntries,
  type IndexedEntrySearchData,
} from "./entrySearch";

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

  const sortedEntries = useMemo(
    () => sortEntries(entries, sortDirection),
    [entries, sortDirection],
  );
  const indexedEntries = useMemo(
    () => createEntrySearchIndex(sortedEntries),
    [sortedEntries],
  );
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
      const tagFilteredEntries = filterIndexedEntriesByTags(
        indexedEntries,
        includedTags,
        excludedTags,
      );

      const nextVisibleEntries = debouncedQuery.trim()
        ? searchIndexedEntries(tagFilteredEntries, debouncedQuery).map(
            (result) => result.entry,
          )
        : tagFilteredEntries.map((item) => item.entry);

      if (searchRunIdRef.current === searchRunId) {
        setVisibleEntries(nextVisibleEntries);
        setIsSearching(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debouncedQuery, excludedTags, includedTags, indexedEntries]);

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

function filterIndexedEntriesByTags(
  indexedEntries: IndexedEntrySearchData[],
  includedTags: string[],
  excludedTags: string[],
) {
  const normalizedIncludedTags = includedTags.map(normalizeTag).filter(Boolean);
  const normalizedExcludedTags = excludedTags.map(normalizeTag).filter(Boolean);

  if (
    normalizedIncludedTags.length === 0 &&
    normalizedExcludedTags.length === 0
  ) {
    return indexedEntries;
  }

  return indexedEntries.filter(
    ({ normalizedTagSet }) =>
      normalizedIncludedTags.every((tag) => normalizedTagSet.has(tag)) &&
      normalizedExcludedTags.every((tag) => !normalizedTagSet.has(tag)),
  );
}
