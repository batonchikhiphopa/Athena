# Athena Search

Athena Entries search is local-only.

## Privacy Boundary

- Raw entry text is read only from browser-local storage and in-memory entry views.
- Search queries are not sent to the backend.
- Search snippets are generated in the browser at render/search time.
- Snippets are not persisted to IndexedDB, the sync queue, logs, or backend storage.
- Backend APIs must not receive raw text, search queries, snippets, search indexes, embeddings, semantic chunks, or query history.
- Query history is not persisted.

## Supported Search Modes

Entries search supports deterministic local matching for:

- plain text terms;
- exact date tokens such as `2026-05-03`;
- included tag tokens such as `#work`;
- excluded tag tokens such as `-#sleep` and `not:#sleep`;
- include/exclude tag controls in the Entries UI.

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
4. ties preserve the current sorted entry order.

Empty search preserves the current sorted entry order.

## UI Behavior

The Entries panel keeps search quiet and operational:

- no persistent result counter such as `17 results`;
- a minimal `No matches` empty state when filters return nothing;
- a compact clear action inside the search input;
- include and exclude tag controls;
- local text snippets/highlights for text matches instead of match chips.

## Local Indexing

Phase 7 uses the existing in-memory local index built from entry views.

A persisted browser-local full-text index should only be added if measured local performance is inadequate. If added later, it must:

- stay in browser-local storage only;
- be rebuildable from local entries;
- be cleared with local app data;
- respect vault/app-lock behavior;
- be documented as privacy-sensitive local derived data.

## Semantic Search

Semantic search is not part of Phase 7.

Phase 7 does not add:

- embeddings;
- vector stores;
- RAG/chat over entries;
- cloud search providers;
- semantic indexing in the sync queue;
- backend search endpoints.

Future semantic search requires a separate privacy and storage design. Local embeddings are preferred. Cloud embeddings require explicit opt-in and a clear provider exposure warning.
