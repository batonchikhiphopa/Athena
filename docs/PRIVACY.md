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
- encrypted Results entities, aliases, proposal decisions, and manual links;
- encrypted activity-insight cache;
- encrypted vault envelopes for entries, drafts, self-reports, aggregates,
  Results corrections, and activity insights.

The vault always stores those records as encrypted envelopes. Passwordless
access changes the unlock experience, not the at-rest record format.

## Backend Textless Data

SQLite stores:

- entry metadata;
- `source_text_hash`;
- sanitized signal rows;
- effective signal rows;
- Signal v5 detail JSON, including enum-only activity context;
- self-report daily aggregate rows;
- insight snapshots;

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

The current signal includes deterministic context fields for entry intent,
structure, and local time context. These fields are computed by Athena from the
current entry text shape and metadata, stored without raw text, and do not give
the provider access to history or hidden memory.

Signal v5 adds activity-specific structured context. It is limited to controlled
enum values and an activity label already present in `activities`; it does not
store excerpts, free-text summaries, people, organizations, or locations.

## Results Insight Boundary

Results grouping and user correction are browser-local. Original extraction is
kept separately from the canonical user version. The activity-insight endpoint
receives a bounded textless batch containing local activity ids and labels so it can
validate and correlate the response, but it does not persist that request or
the generated prose in SQLite.

Per-item tag rules are part of the encrypted browser-local Results
customization. Matching happens locally, does not upload the rule, and ignores
entries whose analysis consent is disabled or whose text is unavailable. A tag
rule can be removed at any time; manual links and confirmed user corrections
remain the higher-precedence canonical sources.

Before calling Gemini, the provider adapter strips activity labels and replaces
local ids with temporary tokens such as `activity_1`. Gemini receives only:

- task/activity kind, stage, rhythm, and burnout relation enums;
- recent event enums and bounded enum-only activity contexts;
- evidence, observation, and span counts;
- the requested UI language.

It does not receive diary prose, entry ids, activity labels, local activity ids,
tags, excerpts, semantic vectors, or RAG evidence. Provider output must match a
strict schema, map one-to-one to the temporary tokens, and pass text
sanitization before the client stores it in the encrypted local cache. Gemini
may use Google Search to ground a general recommendation; search queries are
derived only from the same deidentified structured fields. Sanitized public
source titles and HTTP(S) links are cached with the review so the user can check
the external suggestion. The
server keeps only an in-memory daily quota marker, which resets on process
restart.

The endpoint is called only when the user selects `Formulate review` in an
expanded Results item. Deterministic day/week facts shown inside each Results item do not
call a model. The client limits the request to the same seven-day fact window and
replaces strategy, agency, effect, and blocker-category fields with neutral
values because those details are not displayed in the review. When no narrative
exists, the owning Results item renders an ordinary local phrase from Athena's
shared phrase pool. Observations does not duplicate activity reviews; the
deterministic Results fact tile remains service information only.

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

- legacy server-auth secrets from older exports;
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
