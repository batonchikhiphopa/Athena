import type { EntryView } from "../../types";
import type {
  LocalSemanticEntryDocument,
} from "../semantic/semanticIndex";
import { normalizeTag } from "./entryFilters.ts";

export type EntrySearchField = "date" | "tag" | "text" | "semantic";

export type EntrySearchMode = "hybrid" | "keyword" | "semantic";

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
  semanticDocument?: LocalSemanticEntryDocument;
  semanticDocumentCacheKey?: string;
};

type SemanticIndexModule = typeof import("../semantic/semanticIndex");

type SemanticDocumentCacheResult = {
  created: boolean;
  document: LocalSemanticEntryDocument;
};

const EXACT_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FIELD_ORDER: EntrySearchField[] = ["date", "tag", "text", "semantic"];
const SEMANTIC_DOCUMENT_BATCH_SIZE = 64;
const TEXT_QUERY_STOP_WORDS = new Set([
  "a",
  "about",
  "and",
  "for",
  "from",
  "of",
  "the",
  "to",
  "а",
  "без",
  "в",
  "во",
  "до",
  "для",
  "и",
  "из",
  "или",
  "к",
  "ко",
  "на",
  "но",
  "о",
  "об",
  "от",
  "по",
  "про",
  "с",
  "со",
  "у",
]);

let semanticIndexModulePromise: Promise<SemanticIndexModule> | null = null;

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

    if (!TEXT_QUERY_STOP_WORDS.has(token)) {
      textTerms.push(token);
    }
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

export function searchEntriesHybrid(
  entries: EntryView[],
  query: string,
  mode: EntrySearchMode = "hybrid",
): Promise<EntrySearchResult[]> {
  return searchIndexedEntriesHybrid(createEntrySearchIndex(entries), query, mode);
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

export async function searchIndexedEntriesHybrid(
  indexedEntries: IndexedEntrySearchData[],
  query: string,
  mode: EntrySearchMode = "hybrid",
): Promise<EntrySearchResult[]> {
  const parsedQuery = parseEntrySearchQuery(query);

  if (!parsedQuery.normalized) {
    return indexedEntries.map(({ entry }) => createSearchResult(entry, 0, []));
  }

  if (mode === "keyword") {
    return searchIndexedEntries(indexedEntries, query);
  }

  const semanticQuery = parsedQuery.textTerms.join(" ");

  if (!semanticQuery) {
    return searchIndexedEntries(indexedEntries, query);
  }

  const indexedEntriesById = new Map(
    indexedEntries.map((indexedEntry, index) => [
      indexedEntry.entry.id,
      { index, indexedEntry },
    ]),
  );
  const combined = new Map<
    string,
    { index: number; result: EntrySearchResult }
  >();

  if (mode === "hybrid") {
    for (const result of searchIndexedEntries(indexedEntries, query)) {
      const entryData = indexedEntriesById.get(result.entry.id);
      if (!entryData) continue;

      combined.set(result.entry.id, {
        index: entryData.index,
        result,
      });
    }
  }

  const semanticCandidates = indexedEntries.filter((indexedEntry) =>
    passesStructuredFilters(indexedEntry, parsedQuery),
  );
  const semanticIndex = await loadSemanticIndexModule();
  const semanticDocuments = await getSemanticDocuments(
    semanticCandidates,
    semanticIndex,
  );
  const semanticResults = semanticIndex.searchSemanticEntryIndex(
    semanticDocuments,
    semanticQuery,
    {
      limit: indexedEntries.length,
    },
  );

  for (const semanticResult of semanticResults) {
    const entryData = indexedEntriesById.get(semanticResult.entry.id);
    if (!entryData) continue;

    const score = Math.max(8, Math.round(semanticResult.score * 95));
    const semanticMatch: EntrySearchMatch = {
      field: "semantic",
      value: semanticResult.bestChunk.excerpt,
      score,
    };
    const existing = combined.get(semanticResult.entry.id);

    if (existing) {
      const matches = mergeMatches(existing.result.matches, [semanticMatch]);
      existing.result = createSearchResult(
        existing.result.entry,
        existing.result.score + score,
        matches,
      );
      continue;
    }

    combined.set(semanticResult.entry.id, {
      index: entryData.index,
      result: createSearchResult(semanticResult.entry, score, [semanticMatch]),
    });
  }

  return Array.from(combined.values())
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

function passesStructuredFilters(
  indexedEntry: IndexedEntrySearchData,
  parsedQuery: ParsedEntrySearchQuery,
): boolean {
  if (
    parsedQuery.excludedTags.some((tag) =>
      indexedEntry.normalizedTagSet.has(tag),
    )
  ) {
    return false;
  }

  if (
    !parsedQuery.includedTags.every((tag) =>
      indexedEntry.normalizedTagSet.has(tag),
    )
  ) {
    return false;
  }

  if (
    parsedQuery.dateTerms.length > 0 &&
    !parsedQuery.dateTerms.includes(indexedEntry.normalizedDate)
  ) {
    return false;
  }

  return true;
}

function mergeMatches(
  left: EntrySearchMatch[],
  right: EntrySearchMatch[],
): EntrySearchMatch[] {
  const seen = new Set<string>();
  const matches: EntrySearchMatch[] = [];

  for (const match of [...left, ...right]) {
    const key = `${match.field}:${match.value}`;
    if (seen.has(key)) continue;

    seen.add(key);
    matches.push(match);
  }

  return matches;
}

async function getSemanticDocuments(
  indexedEntries: IndexedEntrySearchData[],
  semanticIndex: SemanticIndexModule,
): Promise<LocalSemanticEntryDocument[]> {
  const documents: LocalSemanticEntryDocument[] = [];
  let createdSinceYield = 0;

  for (let index = 0; index < indexedEntries.length; index += 1) {
    const result = getSemanticDocument(indexedEntries[index], semanticIndex);
    documents.push(result.document);

    if (
      result.created &&
      ++createdSinceYield >= SEMANTIC_DOCUMENT_BATCH_SIZE &&
      index < indexedEntries.length - 1
    ) {
      createdSinceYield = 0;
      await yieldToEventLoop();
    }
  }

  return documents;
}

function getSemanticDocument(
  indexedEntry: IndexedEntrySearchData,
  semanticIndex: SemanticIndexModule,
): SemanticDocumentCacheResult {
  const cacheKey = createSemanticDocumentCacheKey(indexedEntry.entry);

  if (
    indexedEntry.semanticDocument &&
    indexedEntry.semanticDocumentCacheKey === cacheKey
  ) {
    return {
      created: false,
      document: indexedEntry.semanticDocument,
    };
  }

  const semanticDocument = semanticIndex.createSemanticEntryDocument(
    indexedEntry.entry,
  );
  indexedEntry.semanticDocument = semanticDocument;
  indexedEntry.semanticDocumentCacheKey = cacheKey;

  return {
    created: true,
    document: semanticDocument,
  };
}

function loadSemanticIndexModule(): Promise<SemanticIndexModule> {
  if (!semanticIndexModulePromise) {
    semanticIndexModulePromise = import("../semantic/semanticIndex").catch(
      (error) => {
        semanticIndexModulePromise = null;
        throw error;
      },
    );
  }

  return semanticIndexModulePromise;
}

function yieldToEventLoop(): Promise<void> {
  const scheduler = (
    globalThis as {
      scheduler?: {
        yield?: () => Promise<void>;
      };
    }
  ).scheduler;

  if (scheduler?.yield) {
    return scheduler.yield();
  }

  if (typeof MessageChannel !== "undefined") {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(undefined);
    });
  }

  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function createSemanticDocumentCacheKey(entry: EntryView): string {
  return [
    entry.id,
    entry.sourceTextHash,
    entry.entryDate,
    entry.tags.map(normalizeTag).sort().join("\u001f"),
  ].join("\u001e");
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
