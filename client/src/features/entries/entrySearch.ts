import type { EntryView } from "../../types";
import { normalizeTag } from "./entryFilters.ts";

export type EntrySearchResult = {
  entry: EntryView;
  score: number;
  matchedFields: Array<"date" | "tag" | "text">;
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

export function scoreEntryForQuery(
  entry: EntryView,
  normalizedQuery: string,
  tokens = tokenizeSearchQuery(normalizedQuery),
): EntrySearchResult | null {
  if (!normalizedQuery) {
    return {
      entry,
      score: 0,
      matchedFields: [],
    };
  }

  const matchedFields = new Set<"date" | "tag" | "text">();
  let score = 0;

  const normalizedText = normalizeSearchQuery(entry.text);
  const normalizedDate = normalizeSearchQuery(entry.entryDate);
  const normalizedQueryAsTag = normalizeTag(normalizedQuery);
  const normalizedEntryTags = entry.tags.map(normalizeTag).filter(Boolean);
  const normalizedTagSet = new Set(normalizedEntryTags);

  if (normalizedDate === normalizedQuery) {
    matchedFields.add("date");
    score = Math.max(score, 100);
  }

  if (normalizedTagSet.has(normalizedQueryAsTag)) {
    matchedFields.add("tag");
    score = Math.max(score, 100);
  }

  const tokenTagMatches = tokens.filter((token) =>
    normalizedTagSet.has(normalizeTag(token)),
  );

  if (tokenTagMatches.length > 0) {
    matchedFields.add("tag");
    score = Math.max(score, tokenTagMatches.length === tokens.length ? 80 : 45);
  }

  if (normalizedText.includes(normalizedQuery)) {
    matchedFields.add("text");
    score = Math.max(score, 70);
  } else if (tokens.length > 0) {
    const matchedTextTokens = tokens.filter((token) =>
      normalizedText.includes(token),
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
    entry,
    score,
    matchedFields: Array.from(matchedFields),
  };
}

export function searchEntries(
  entries: EntryView[],
  query: string,
): EntrySearchResult[] {
  const normalizedQuery = normalizeSearchQuery(query);
  const tokens = tokenizeSearchQuery(normalizedQuery);

  if (!normalizedQuery) {
    return entries.map((entry) => ({
      entry,
      score: 0,
      matchedFields: [],
    }));
  }

  return entries
    .map((entry, index) => ({
      index,
      result: scoreEntryForQuery(entry, normalizedQuery, tokens),
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
