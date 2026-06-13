import type { EntryView } from "../../types";
import {
  LOCAL_HASHED_EMBEDDING_PROVIDER,
  cosineSimilarity,
  embedLocalText,
  extractEmbeddingConcepts,
  tokenizeEmbeddingText,
  type LocalEmbeddingVector,
} from "./localEmbeddings";

export type LocalSemanticChunk = {
  chunkId: string;
  chunkIndex: number;
  embedding: LocalEmbeddingVector;
  entryDate: string;
  entryId: string;
  excerpt: string;
  sourceTextHash: string;
  tags: string[];
  tokenCount: number;
  topics: string[];
};

export type LocalSemanticEntryDocument = {
  chunks: LocalSemanticChunk[];
  embedding: LocalEmbeddingVector;
  entry: EntryView;
  providerId: typeof LOCAL_HASHED_EMBEDDING_PROVIDER.id;
};

export type LocalSemanticSearchResult = {
  bestChunk: LocalSemanticChunk;
  entry: EntryView;
  score: number;
  supportChunks: LocalSemanticChunk[];
};

type SemanticSearchOptions = {
  limit?: number;
  minSimilarity?: number;
};

const DEFAULT_CHUNK_MAX_CHARS = 620;
const DEFAULT_CHUNK_MIN_CHARS = 120;
const DEFAULT_MIN_SIMILARITY = 0.045;

export function createSemanticEntryIndex(
  entries: EntryView[],
): LocalSemanticEntryDocument[] {
  return entries.map(createSemanticEntryDocument);
}

export function createSemanticEntryDocument(
  entry: EntryView,
): LocalSemanticEntryDocument {
  return {
    chunks: chunkEntry(entry),
    embedding: embedLocalText(createEmbeddingSource(entry)),
    entry,
    providerId: LOCAL_HASHED_EMBEDDING_PROVIDER.id,
  };
}

export function searchSemanticEntryIndex(
  documents: LocalSemanticEntryDocument[],
  query: string,
  options: SemanticSearchOptions = {},
): LocalSemanticSearchResult[] {
  if (tokenizeEmbeddingText(query).length === 0) return [];

  const queryEmbedding = embedLocalText(query);
  const limit = Math.max(1, options.limit ?? 20);
  const minSimilarity = options.minSimilarity ?? DEFAULT_MIN_SIMILARITY;
  const byEntryId = new Map<string, LocalSemanticSearchResult>();

  for (const document of documents) {
    for (const chunk of document.chunks) {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      if (score < minSimilarity) continue;

      const current = byEntryId.get(document.entry.id);
      if (!current || score > current.score) {
        byEntryId.set(document.entry.id, {
          bestChunk: chunk,
          entry: document.entry,
          score,
          supportChunks: [chunk],
        });
        continue;
      }

      current.supportChunks.push(chunk);
    }
  }

  return Array.from(byEntryId.values())
    .map((result) => ({
      ...result,
      supportChunks: result.supportChunks
        .sort((left, right) =>
          left.chunkIndex === result.bestChunk.chunkIndex
            ? -1
            : right.chunkIndex === result.bestChunk.chunkIndex
              ? 1
              : left.chunkIndex - right.chunkIndex,
        )
        .slice(0, 3),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.bestChunk.tokenCount - left.bestChunk.tokenCount ||
        left.entry.entryDate.localeCompare(right.entry.entryDate),
    )
    .slice(0, limit);
}

export function createSemanticChunkId(
  entry: EntryView,
  chunkIndex: number,
  text: string,
): string {
  return [
    "sem",
    entry.id,
    chunkIndex,
    stableHash(`${entry.sourceTextHash}:${chunkIndex}:${text}`),
  ].join(":");
}

function chunkEntry(entry: EntryView): LocalSemanticChunk[] {
  const chunks = chunkText(entry.text);

  return chunks.map((text, chunkIndex) => ({
    chunkId: createSemanticChunkId(entry, chunkIndex, text),
    chunkIndex,
    embedding: embedLocalText(createEmbeddingSource(entry, text)),
    entryDate: entry.entryDate,
    entryId: entry.id,
    excerpt: text,
    sourceTextHash: entry.sourceTextHash,
    tags: entry.tags,
    tokenCount: tokenizeEmbeddingText(text).length,
    topics: extractEmbeddingConcepts(createEmbeddingSource(entry, text)),
  }));
}

function createEmbeddingSource(entry: EntryView, chunkText = entry.text): string {
  return [chunkText, entry.tags.map((tag) => `#${tag}`).join(" ")]
    .filter(Boolean)
    .join("\n");
}

function chunkText(text: string): string[] {
  const normalized = text.trim().replace(/\r/g, "");
  if (!normalized) return [""];

  const fragments = normalized
    .split(/\n{2,}|(?<=[.!?])\s+/u)
    .map((fragment) => fragment.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const fragment of fragments.length > 0 ? fragments : [normalized]) {
    if (!current) {
      current = fragment;
      continue;
    }

    const candidate = `${current} ${fragment}`;
    if (
      candidate.length <= DEFAULT_CHUNK_MAX_CHARS ||
      current.length < DEFAULT_CHUNK_MIN_CHARS
    ) {
      current = candidate;
      continue;
    }

    chunks.push(current);
    current = fragment;
  }

  if (current) chunks.push(current);

  return chunks.flatMap((chunk) => splitOversizedChunk(chunk));
}

function splitOversizedChunk(chunk: string): string[] {
  if (chunk.length <= DEFAULT_CHUNK_MAX_CHARS) return [chunk];

  const parts: string[] = [];
  let cursor = 0;

  while (cursor < chunk.length) {
    const hardEnd = Math.min(cursor + DEFAULT_CHUNK_MAX_CHARS, chunk.length);
    const softEnd =
      hardEnd < chunk.length ? chunk.lastIndexOf(" ", hardEnd) : hardEnd;
    const end = softEnd > cursor + DEFAULT_CHUNK_MIN_CHARS ? softEnd : hardEnd;

    parts.push(chunk.slice(cursor, end).trim());
    cursor = end;
  }

  return parts.filter(Boolean);
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
