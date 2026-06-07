import type { EntryView } from "../../types";
import { normalizeTag } from "./entryFilters.ts";

export type EntrySearchField = "date" | "tag" | "text";

export type EntrySearchMatch = {
  field: EntrySearchField;
  value: string;
  score: number;
};

export type EntrySearchResult = {
  entry: EntryView;
  score: number;
  matchedFields: EntrySearchField[];
  matches: EntrySearchMatch[];
};

export type EntrySearchSnippet = {
  before: string;
  match: string;
  after: string;
};

export type ParsedEntrySearchQuery = {
  raw: string;
  normalized: string;
  textTerms: string[];
  dateTerms: string[];
  includedTags: string[];
  excludedTags: string[];
};

export type IndexedEntrySearchData = {
  entry: EntryView;
  normalizedDate: string;
  normalizedTagSet: Set<string>;
  normalizedText: string;
};

const EXACT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FIELD_ORDER: EntrySearchField[] = ["date", "tag", "text"];

export function normalizeSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function tokenizeSearchQuery(query: string): string[] {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) return [];

  return uniqueNormalizedValues(
    normalizedQuery
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean),
  );
}

export function parseEntrySearchQuery(query: string): ParsedEntrySearchQuery {
  const normalized = normalizeSearchQuery(query);
  const tokens = tokenizeSearchQuery(normalized);
  const textTerms: string[] = [];
  const dateTerms: string[] = [];
  const includedTags: string[] = [];
  const excludedTags: string[] = [];

  for (const token of tokens) {
    if (EXACT_DATE_PATTERN.test(token)) {
      dateTerms.push(token);
      continue;
    }

    if (token.startsWith("-#")) {
      const tag = normalizeTag(token.slice(2));
      if (tag) excludedTags.push(tag);
      continue;
    }

    if (token.startsWith("not:#")) {
      const tag = normalizeTag(token.slice(5));
      if (tag) excludedTags.push(tag);
      continue;
    }

    if (token.startsWith("#")) {
      const tag = normalizeTag(token.slice(1));
      if (tag) includedTags.push(tag);
      continue;
    }

    textTerms.push(token);
  }

  return {
    raw: query,
    normalized,
    textTerms: uniqueNormalizedValues(textTerms),
    dateTerms: uniqueNormalizedValues(dateTerms),
    includedTags: uniqueNormalizedValues(includedTags),
    excludedTags: uniqueNormalizedValues(excludedTags),
  };
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
  query: string | ParsedEntrySearchQuery,
): EntrySearchResult | null {
  return scoreIndexedEntryForQuery(indexEntryForSearch(entry), query);
}

export function scoreIndexedEntryForQuery(
  indexedEntry: IndexedEntrySearchData,
  query: string | ParsedEntrySearchQuery,
): EntrySearchResult | null {
  const parsedQuery =
    typeof query === "string" ? parseEntrySearchQuery(query) : query;

  if (!parsedQuery.normalized) {
    return createSearchResult(indexedEntry.entry, 0, []);
  }

  if (
    parsedQuery.excludedTags.some((tag) =>
      indexedEntry.normalizedTagSet.has(tag),
    )
  ) {
    return null;
  }

  if (
    !parsedQuery.includedTags.every((tag) =>
      indexedEntry.normalizedTagSet.has(tag),
    )
  ) {
    return null;
  }

  const matches: EntrySearchMatch[] = [];

  for (const dateTerm of parsedQuery.dateTerms) {
    if (indexedEntry.normalizedDate === dateTerm) {
      matches.push({ field: "date", value: dateTerm, score: 120 });
    }
  }

  for (const tag of parsedQuery.includedTags) {
    matches.push({ field: "tag", value: tag, score: 90 });
  }

  const tokenTagMatches = parsedQuery.textTerms.filter((term) =>
    indexedEntry.normalizedTagSet.has(normalizeTag(term)),
  );

  for (const tagTerm of tokenTagMatches) {
    matches.push({ field: "tag", value: tagTerm, score: 45 });
  }

  const normalizedTextPhrase = parsedQuery.textTerms.join(" ");

  if (
    normalizedTextPhrase &&
    indexedEntry.normalizedText.includes(normalizedTextPhrase)
  ) {
    matches.push({ field: "text", value: normalizedTextPhrase, score: 70 });
  } else if (parsedQuery.textTerms.length > 0) {
    const matchedTextTerms = parsedQuery.textTerms.filter((term) =>
      indexedEntry.normalizedText.includes(term),
    );

    if (matchedTextTerms.length === parsedQuery.textTerms.length) {
      matches.push({
        field: "text",
        value: matchedTextTerms.join(" "),
        score: 55,
      });
    } else if (matchedTextTerms.length > 0) {
      for (const term of matchedTextTerms) {
        matches.push({ field: "text", value: term, score: 30 });
      }
    }
  }

  const hasPositiveSearchTerms =
    parsedQuery.textTerms.length > 0 ||
    parsedQuery.dateTerms.length > 0 ||
    parsedQuery.includedTags.length > 0;

  if (matches.length === 0 && hasPositiveSearchTerms) return null;

  return createSearchResult(
    indexedEntry.entry,
    matches.reduce((total, match) => total + match.score, 0),
    matches,
  );
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
  const parsedQuery = parseEntrySearchQuery(query);

  if (!parsedQuery.normalized) {
    return indexedEntries.map(({ entry }) => createSearchResult(entry, 0, []));
  }

  return indexedEntries
    .map((indexedEntry, index) => ({
      index,
      result: scoreIndexedEntryForQuery(indexedEntry, parsedQuery),
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

export function createEntrySearchSnippet(
  text: string,
  query: string,
  maxLength = 160,
): EntrySearchSnippet | null {
  const terms = getSnippetSearchTerms(query);

  if (terms.length === 0) return null;

  for (const term of terms) {
    const range = findCaseInsensitiveRange(text, term);
    if (!range) continue;

    return createSnippetFromRange(text, range.start, range.end, maxLength);
  }

  return null;
}

function createSearchResult(
  entry: EntryView,
  score: number,
  matches: EntrySearchMatch[],
): EntrySearchResult {
  return {
    entry,
    score,
    matchedFields: getMatchedFields(matches),
    matches,
  };
}

function getMatchedFields(matches: EntrySearchMatch[]): EntrySearchField[] {
  const fields = new Set(matches.map((match) => match.field));

  return FIELD_ORDER.filter((field) => fields.has(field));
}

function getSnippetSearchTerms(query: string): string[] {
  const { textTerms } = parseEntrySearchQuery(query);
  const phrase = textTerms.join(" ");

  return uniqueNormalizedValues([phrase, ...textTerms].filter(Boolean));
}

function findCaseInsensitiveRange(
  text: string,
  term: string,
): { start: number; end: number } | null {
  const normalizedText = text.toLocaleLowerCase();
  const normalizedTerm = term.toLocaleLowerCase();
  const start = normalizedText.indexOf(normalizedTerm);

  if (start < 0) return null;

  return {
    start,
    end: start + normalizedTerm.length,
  };
}

function createSnippetFromRange(
  text: string,
  matchStart: number,
  matchEnd: number,
  maxLength: number,
): EntrySearchSnippet {
  const safeMaxLength = Math.max(40, maxLength);
  const matchLength = matchEnd - matchStart;
  const contextLength = Math.max(20, safeMaxLength - matchLength);
  const beforeLength = Math.floor(contextLength / 2);
  const afterLength = contextLength - beforeLength;
  const snippetStart = Math.max(0, matchStart - beforeLength);
  const snippetEnd = Math.min(text.length, matchEnd + afterLength);

  return {
    before: `${snippetStart > 0 ? "…" : ""}${text.slice(
      snippetStart,
      matchStart,
    )}`,
    match: text.slice(matchStart, matchEnd),
    after: `${text.slice(matchEnd, snippetEnd)}${
      snippetEnd < text.length ? "…" : ""
    }`,
  };
}

function uniqueNormalizedValues(values: string[]): string[] {
  return Array.from(new Set(values.map(normalizeSearchQuery).filter(Boolean)));
}
