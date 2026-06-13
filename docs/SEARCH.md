# Athena Search

Athena Entries search is local-only.

## Privacy Boundary

- Raw entry text is read only from browser-local storage and in-memory entry views.
- Search queries are not sent to the backend.
- Search snippets are generated in the browser at render/search time.
- Snippets are not persisted to IndexedDB, the sync queue, logs, or backend storage.
- Backend APIs must not receive raw text, search queries, snippets, search indexes, embeddings, semantic chunks, or query history.
- Query history is not persisted.

## Supported Search

Entries search supports deterministic local matching for:

- plain text terms;
- exact date tokens such as `2026-05-03`;
- included tag tokens such as `#work`;
- excluded tag tokens such as `-#sleep` and `not:#sleep`;
- include/exclude tag controls in the Entries UI;
- local semantic similarity.

The Entries UI always uses hybrid search. There is no user-facing mode switch:
one query is evaluated through keyword/date/tag matching and local semantic
retrieval together.

Examples:

```text
focus
2026-05-03
#work
#work -#sleep
not:#noise
```

## Ranking Policy

Search ranking is deterministic:

1. exact date matches rank high;
2. explicit tag matches rank above incidental text matches;
3. text phrase matches rank above partial token matches;
4. hybrid semantic matches add local similarity support;
5. ties preserve the current sorted entry order.

Empty search preserves the current sorted entry order.

## UI Behavior

The Entries panel keeps search quiet and operational:

- no persistent result counter such as `17 results`;
- a minimal `No matches` empty state when filters return nothing;
- a compact clear action inside the search input;
- include and exclude tag controls;
- local text snippets/highlights for text matches instead of match chips.

## Local Indexing

Current keyword/date/tag search uses an in-memory local index built from entry
views. The semantic layer adds an in-memory local semantic index over entry
chunks.

A persisted browser-local full-text index should only be added if measured local performance is inadequate. If added later, it must:

- stay in browser-local storage only;
- be rebuildable from local entries;
- be cleared with local app data;
- respect vault/app-lock behavior;
- be documented as privacy-sensitive local derived data.

## Semantic Search

Semantic search is local-only and retrieval-only.

Current implementation:

- chunks entry text in the browser;
- computes deterministic local hashed embeddings through
  `local-hashed-semantic-v1`;
- uses a small bounded semantic normalization layer for common work, fatigue,
  stress, focus, recovery, and mood vocabulary in Russian and English;
- runs as part of the always-on hybrid Entries search;
- applies date and include/exclude tag filters before semantic retrieval;
- keeps semantic vectors rebuildable from local entries and does not send them
  to the backend.

The local hashed embedding provider is not a clinical model and does not infer a
diagnosis, personality state, or risk. It is a retrieval helper for finding
related entries.

Still out of scope:

- cloud search providers;
- cloud embeddings;
- semantic indexing in the sync queue;
- persisted vector stores;
- backend search endpoints.

Cloud embeddings require explicit opt-in and a clear provider exposure warning.

## Local RAG Evidence Packs

Athena has a local evidence-pack builder for browser-local interpretation
surfaces.

Evidence packs are created in the browser from local entries and include:

- retrieved chunks with dates, tags, source hashes, and similarity scores;
- textless measured signals from the retrieved entries;
- uncertainty flags such as limited support or weak similarity.

The pack is marked `browser_local` and `leavesDevice: false`. It may contain raw
entry excerpts, so it must not be sent to backend APIs or exported silently.

The first interpretation layer is constrained and local: it can summarize
retrieved support, state a soft hypothesis, suggest a small reversible review
step, or abstain when there is no retrieved support. Every non-abstained
observation must cite evidence ids.
