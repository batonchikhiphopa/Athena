# Privacy Model

Athena is designed around a strict boundary:

```text
raw private data stays local
backend receives textless structure only
```

## Browser-Local Raw Data

IndexedDB stores:

- raw diary text;
- drafts;
- local entry dates;
- tags;
- analysis toggles;
- raw self-report events;
- queue state;
- vault envelopes when protection is enabled.

When local app protection is enabled, diary data and self-report records are migrated into encrypted vault envelopes.

## Backend Textless Data

SQLite stores:

- entry metadata;
- `source_text_hash`;
- sanitized signal rows;
- effective signal rows;
- Signal v4 detail JSON;
- self-report daily aggregate rows;
- insight snapshots;
- auth/session data.

SQLite must not store:

- raw diary text;
- raw self-report answers;
- raw self-report event timestamps;
- hidden model memory;
- RAG snippets from private text.

## Extraction Boundary

If analysis is enabled, the current entry text may be passed transiently to the configured extraction provider.

Providers:

- `off`: no model call, fallback behavior.
- `ollama`: intended local model path.
- `gemini`: cloud API path, current entry text is sent to Gemini.

Extraction must not use:

- diary history;
- RAG;
- hidden memory;
- prior trends;
- unrelated entries.

Signal v4 adds deterministic context fields for entry intent, structure, and local time context. These fields are computed by Athena from the current entry text shape and metadata, stored without raw text, and do not give the provider access to history or hidden memory.

## Self-Report Boundary

Self-reports are entry-attached local anchors.

Raw self-report events stay in IndexedDB. The backend receives only daily numeric aggregates:

- `count`;
- `sum`;
- `sum_squares`;
- `mean`;
- `min`;
- `max`;
- axis;
- local day;
- schema versions.

This lets analytics consume repeated self-report signals without turning SQLite into a private questionnaire database.

## Data Export And Import

Athena has two separate export surfaces:

- `local_export.v1` is a browser-local JSON export created only by direct user action. It may contain raw diary text, raw local self-report events, tags, selected local settings, existing `source_text_hash` values, and queue-safe metadata summaries.
- `backend_metadata_export.v1` is a backend metadata export. It is textless and must not be treated as a full diary backup because SQLite does not contain raw diary text.

Local export files are sensitive private files. `source_text_hash` is not raw diary text, but it is a fingerprint of raw diary text and can prove that a known text matches an exported entry. It must not be described as anonymous or harmless.

When local app protection is enabled, the vault may protect IndexedDB records. A downloaded `local_export.v1` file is plaintext in the first implementation after explicit user action and vault unlock. After download, Athena cannot protect that file. Users should store it carefully or encrypt it themselves.

Export/import must not include or restore:

- server auth session cookies;
- CSRF tokens;
- session token hashes;
- password hashes;
- vault passwords;
- vault keys or key material;
- provider API keys;
- raw queue payloads;
- hidden browser caches;
- semantic indexes, embeddings, RAG snippets, or hidden model memory.

Import must validate the package schema and version before writing anything. Import preview must not write data and must not call the backend. The first implementation uses replace-local-data mode; merge-by-id is deferred until conflict semantics are designed and tested.

## Semantic Search And Evidence Packs

Semantic search is browser-local by default.

The current implementation computes deterministic local hashed embeddings from
entry chunks in memory. These embeddings and chunks are private derived data:
they can reveal meaning even when they are not raw text. Athena does not send
semantic vectors, search queries, retrieved chunks, or local RAG evidence packs
to backend APIs.

Local RAG evidence packs may include raw excerpts so the user can inspect why a
result or interpretation was produced. Those packs are marked `browser_local`
and `leavesDevice: false`; they are not persisted to the backend and are not
included in `local_export.v1`.

Cloud embeddings or cloud AI over diary history remain out of scope unless a
future feature adds explicit opt-in and a provider exposure warning.
