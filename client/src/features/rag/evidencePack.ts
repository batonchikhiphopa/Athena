import type { EntryView } from "../../types";
import {
  createEntrySearchIndex,
  searchIndexedEntriesHybrid,
} from "../entries/entrySearch";
import {
  LOCAL_HASHED_EMBEDDING_PROVIDER,
  extractEmbeddingConcepts,
} from "../semantic/localEmbeddings";
import {
  createSemanticEntryIndex,
  searchSemanticEntryIndex,
} from "../semantic/semanticIndex";

export type LocalRagEvidenceKind = "measured_signal" | "retrieved_support";

export type LocalRagMeasuredSignal = {
  axis: "fatigue" | "focus" | "load";
  entryDate: string;
  entryId: string;
  id: string;
  kind: "measured_signal";
  sourceTextHash: string;
  value: number;
};

export type LocalRagRetrievedSupport = {
  chunkId: string;
  entryDate: string;
  entryId: string;
  excerpt: string;
  id: string;
  includedBecause: string[];
  kind: "retrieved_support";
  score: number;
  sourceTextHash: string;
  tags: string[];
};

export type LocalRagEvidencePack = {
  createdAt: string;
  embeddingProvider: typeof LOCAL_HASHED_EMBEDDING_PROVIDER;
  measuredSignals: LocalRagMeasuredSignal[];
  privacy: {
    leavesDevice: false;
    rawTextIncluded: boolean;
    scope: "browser_local";
  };
  query: string;
  retrievedSupport: LocalRagRetrievedSupport[];
  uncertainty: string[];
  version: "rag_evidence_pack.v1";
};

type EvidencePackOptions = {
  createdAt?: string;
  maxEntries?: number;
  maxSupportChunks?: number;
};

const AXES = ["load", "fatigue", "focus"] as const;

export async function buildLocalRagEvidencePack(
  entries: EntryView[],
  query: string,
  options: EvidencePackOptions = {},
): Promise<LocalRagEvidencePack> {
  const maxEntries = Math.max(1, options.maxEntries ?? 6);
  const maxSupportChunks = Math.max(1, options.maxSupportChunks ?? 8);
  const indexedEntries = createEntrySearchIndex(entries);
  const hybridResults = (
    await searchIndexedEntriesHybrid(indexedEntries, query, "hybrid")
  ).slice(0, maxEntries);
  const semanticResults = searchSemanticEntryIndex(
    createSemanticEntryIndex(hybridResults.map((result) => result.entry)),
    query,
    {
      limit: maxSupportChunks,
      minSimilarity: 0,
    },
  );
  const semanticSupportByEntryId = new Map(
    semanticResults.map((result) => [result.entry.id, result]),
  );
  const retrievedSupport = hybridResults
    .flatMap((result) => {
      const semanticResult = semanticSupportByEntryId.get(result.entry.id);
      const supportChunks =
        semanticResult?.supportChunks.length
          ? semanticResult.supportChunks
          : result.entry.text
            ? [
                {
                  chunkId: `lexical:${result.entry.id}`,
                  entryDate: result.entry.entryDate,
                  entryId: result.entry.id,
                  excerpt: result.entry.text,
                  score: result.score / 100,
                  sourceTextHash: result.entry.sourceTextHash,
                  tags: result.entry.tags,
                  topics: extractEmbeddingConcepts(
                    `${query} ${result.entry.text}`,
                  ),
                },
              ]
            : [];

      return supportChunks.map((chunk, index) => ({
        chunkId: chunk.chunkId,
        entryDate: chunk.entryDate,
        entryId: chunk.entryId,
        excerpt: trimExcerpt(chunk.excerpt),
        id: `support:${chunk.chunkId}`,
        includedBecause: createIncludedBecause(query, chunk.topics, index),
        kind: "retrieved_support" as const,
        score: roundScore(
          semanticResult?.bestChunk.chunkId === chunk.chunkId
            ? semanticResult.score
            : "score" in chunk
              ? chunk.score
              : 0,
        ),
        sourceTextHash: chunk.sourceTextHash,
        tags: chunk.tags,
      }));
    })
    .slice(0, maxSupportChunks);
  const measuredSignals = collectMeasuredSignals(
    hybridResults.map((result) => result.entry),
  );

  return {
    createdAt: options.createdAt ?? new Date().toISOString(),
    embeddingProvider: LOCAL_HASHED_EMBEDDING_PROVIDER,
    measuredSignals,
    privacy: {
      leavesDevice: false,
      rawTextIncluded: retrievedSupport.length > 0,
      scope: "browser_local",
    },
    query,
    retrievedSupport,
    uncertainty: createEvidenceUncertainty(retrievedSupport, measuredSignals),
    version: "rag_evidence_pack.v1",
  };
}

function collectMeasuredSignals(entries: EntryView[]): LocalRagMeasuredSignal[] {
  return entries.flatMap((entry) =>
    AXES.flatMap((axis) => {
      const value = entry.signals[axis];
      if (typeof value !== "number") return [];

      return [
        {
          axis,
          entryDate: entry.entryDate,
          entryId: entry.id,
          id: `signal:${entry.id}:${axis}`,
          kind: "measured_signal" as const,
          sourceTextHash: entry.sourceTextHash,
          value,
        },
      ];
    }),
  );
}

function createIncludedBecause(
  query: string,
  topics: string[],
  index: number,
): string[] {
  const reasons = [`ranked_for_query:${query.trim() || "empty"}`];

  for (const topic of topics.slice(0, 3)) {
    reasons.push(`semantic_topic:${topic}`);
  }

  if (index > 0) reasons.push("neighbor_chunk");

  return reasons;
}

function createEvidenceUncertainty(
  support: LocalRagRetrievedSupport[],
  measuredSignals: LocalRagMeasuredSignal[],
): string[] {
  const uncertainty: string[] = [];

  if (support.length === 0) {
    uncertainty.push("no_retrieved_support");
  } else if (support.length < 2) {
    uncertainty.push("limited_retrieved_support");
  }

  if (measuredSignals.length === 0) {
    uncertainty.push("no_measured_signal_in_retrieved_entries");
  }

  if (support.some((item) => item.score < 0.08)) {
    uncertainty.push("weak_similarity_support");
  }

  return uncertainty;
}

function trimExcerpt(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= 260) return normalized;

  return `${normalized.slice(0, 257).trim()}...`;
}

function roundScore(score: number): number {
  return Math.round(Math.max(0, score) * 1000) / 1000;
}
