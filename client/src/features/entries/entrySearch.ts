import type { EntryView } from "../../types";
import { normalizeTag } from "./entryFilters.ts";

export type EntrySearchResult = {
  entry: EntryView;
  score: number;
  matchedFields: Array<"date" | "tag" | "text">;
};

export type IndexedEntrySearchData = {
  entry: EntryView;
  normalizedDate: string;
  normalizedTagSet: Set<string>;
  normalizedText: string;
};

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function tokenizeSearchQuery(query: string): string[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) return [];

  return Array.from(
    new Set(normalizedQuery.split(" ").map((token) => token.trim()).filter(Boolean)),
  );
}

export function createEntrySearchIndex(
  entries: EntryView[],
): IndexedEntrySearchData[] {
  return entries.map(indexEntryForSearch);
}

export function indexEntryForSearch(entry: EntryView): IndexedEntrySearchData {
  return {
    entry,
    normalizedDate: normalizeSearchQuery(entry.entryDate),
    normalizedTagSet: new Set(entry.tags.map(normalizeTag).filter(Boolean)),
    normalizedText: normalizeSearchQuery(entry.text),
  };
}

export function scoreEntryForQuery(
  entry: EntryView,
  normalizedQuery: string,
  tokens = tokenizeSearchQuery(normalizedQuery),
): EntrySearchResult | null {
  return scoreIndexedEntryForQuery(
    indexEntryForSearch(entry),
    normalizedQuery,
    tokens,
  );
}

export function scoreIndexedEntryForQuery(
  indexedEntry: IndexedEntrySearchData,
  normalizedQuery: string,
  tokens = tokenizeSearchQuery(normalizedQuery),
): EntrySearchResult | null {
  if (!normalizedQuery) {
    return {
      entry: indexedEntry.entry,
      score: 0,
      matchedFields: [],
    };
  }

  const matchedFields = new Set<"date" | "tag" | "text">();
  let score = 0;

  const normalizedQueryAsTag = normalizeTag(normalizedQuery);

  if (indexedEntry.normalizedDate === normalizedQuery) {
    matchedFields.add("date");
    score = Math.max(score, 100);
  }

  if (indexedEntry.normalizedTagSet.has(normalizedQueryAsTag)) {
    matchedFields.add("tag");
    score = Math.max(score, 100);
  }

  const tokenTagMatches = tokens.filter((token) =>
    indexedEntry.normalizedTagSet.has(normalizeTag(token)),
  );

  if (tokenTagMatches.length > 0) {
    matchedFields.add("tag");
    score = Math.max(score, tokenTagMatches.length === tokens.length ? 80 : 45);
  }

  if (indexedEntry.normalizedText.includes(normalizedQuery)) {
    matchedFields.add("text");
    score = Math.max(score, 70);
  } else if (tokens.length > 0) {
    const matchedTextTokens = tokens.filter((token) =>
      indexedEntry.normalizedText.includes(token),
    );

    if (matchedTextTokens.length === tokens.length) {
      matchedFields.add("text");
      score = Math.max(score, 55);
    } else if (matchedTextTokens.length > 0) {
      matchedFields.add("text");
      score = Math.max(score, 30 + matchedTextTokens.length);
    }
  }

  if (matchedFields.size === 0) return null;

  return {
    entry: indexedEntry.entry,
    score,
    matchedFields: Array.from(matchedFields),
  };
}

export function searchEntries(
  entries: EntryView[],
  query: string,
): EntrySearchResult[] {
  return searchIndexedEntries(createEntrySearchIndex(entries), query);
}

export function searchIndexedEntries(
  indexedEntries: IndexedEntrySearchData[],
  query: string,
): EntrySearchResult[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const tokens = tokenizeSearchQuery(normalizedQuery);

  if (!normalizedQuery) {
    return indexedEntries.map(({ entry }) => ({
      entry,
      score: 0,
      matchedFields: [],
    }));
  }

  return indexedEntries
    .map((indexedEntry, index) => ({
      index,
      result: scoreIndexedEntryForQuery(indexedEntry, normalizedQuery, tokens),
    }))
    .filter(
      (item): item is { index: number; result: EntrySearchResult } =>
        item.result !== null,
    )
    .sort((left, right) => {
      const scoreOrder = right.result.score - left.result.score;
      if (scoreOrder !== 0) return scoreOrder;

      return left.index - right.index;
    })
    .map((item) => item.result);
}
