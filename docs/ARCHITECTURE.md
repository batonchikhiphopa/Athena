# Architecture

Athena is a local-first reflection app with a calm editor surface and a strict analytical engine underneath.

The central design decision is a privacy boundary:

```text
browser local data
-> textless backend metadata
-> deterministic analytics
-> bounded observations
```

## System Overview

```text
React client
  - light paper-like workspace with icon rail
  - editor-first writing surface
  - searchable Entries card grid
  - unified expandable Results list built from local entries
  - floating Observations and Settings panels
  - IndexedDB raw entries, drafts, self-report events, and Results corrections
  - optional local vault encryption
  - durable operation queue
  - browser-local hybrid search and semantic/RAG helpers
  - service worker app shell

Express backend
  - Zod request validation
  - unauthenticated local API
  - SQLite metadata and signals
  - deterministic analytics and Analytics V2 summaries
  - Insight V3 snapshots
  - deidentified activity-insight orchestration

Extraction providers
  - off fallback
  - local Ollama
  - Gemini API when explicitly configured

Results insight provider
  - one explicit, user-requested bounded Gemini batch per day
  - temporary activity tokens and textless structured input only
  - Google Search grounding for optional general recommendations
```

## Data Boundary

Raw diary text stays in the browser. The backend stores:

- entry ids and dates;
- tags;
- `source_text_hash`;
- sanitized signals;
- effective signals;
- self-report daily aggregates;
- insight snapshots;

The backend does not store raw diary text, raw self-report events, search
queries, semantic vectors, RAG excerpts, or hidden model memory.

## Product Shape

Athena opens into the editor, not a dashboard. The current visible product
surfaces are:

- **Editor**: the primary writing surface with tags, local autosave, per-entry
  analysis control, voluntary self-report scales, and a quick new-entry action.
- **Entries**: a card-grid archive with always-on local hybrid search across
  text, dates, tags, excluded tags, and semantic similarity.
- **Results**: one unfiltered list of task/project and repeatable-activity
  identities confirmed by the user in the browser. A row expands on click to
  show either its formulated narrative or an ordinary Athena phrase from the
  shared phrase pool. A standalone deterministic day/week fact tile then sits
  beside the original activity graph, followed by source entry tiles. Stage and
  rhythm live inside the fact tile, which contains service information only;
  the collapsed row keeps only the latest source-entry date. Its
  round settings button uses the same icon as global Settings and opens a separate correction panel for
  rename, type correction, aliases, user-selected tag rules, merge, split,
  manual links, and exclusions.
- **Observations**: a floating history panel for saved day, week, and month
  snapshots, new extraction proposals, and per-card deletion. Results narratives
  and phrase-pool fallbacks are not duplicated here.
- **Settings**: a floating panel for interface, access, records, and data
  controls.

The surface stays quiet; analytical detail appears only through expanded
Results rows, bounded observations, settings, queue/status controls, or
debug-only affordances.

## Results Pipeline

```text
analyzed local entries
-> extracted activities and activity_contexts
-> exact identity catalog + bounded project-tag hints
-> pending extraction proposals
-> user acceptance, correction, or rejection
-> encrypted canonical Results customization
-> reversible automatic links from per-item user tag rules
-> local activity aggregation from canonical links
-> deterministic day/week facts inside expandable Results rows
-> Gemini narrative or phrase-pool fallback inside the owning Results row
-> source entry tiles
-> encrypted browser-local insight cache
```

Specific project tags are identity hints, not automatic activities. One
specific tag may name a project only when the entry also contains task/project
evidence. Broad tags such as a domain or subject, and entries with multiple
possible project tags, do not create project identities. Exact configured
cross-language aliases may share an identity; general fuzzy merging is not
used.

Configured Results tag rules are different from extraction-time project-tag
hints. They are explicit user corrections stored on the canonical entity. A
matching analyzable entry is linked locally with an unknown event until a
confirmed extraction decision or manual link supplies a more specific event.
Removing the tag rule removes that automatic link on the next local rebuild.

## Current Project Shape

```text
client/
  src/
    app/                 composition, navigation, lifecycle, cross-feature cleanup
    features/            vertical product modules with API, state, storage, UI, content
    components/          genuinely shared UI primitives only
    platform/storage/    IndexedDB bootstrap and object-store ownership
    shared/http/         JSON headers and HTTP error mechanics
    shared/lib/          small reusable browser/date/text utilities
    i18n/                interface messages and language selection

server/
  modules/               vertical route/schema/service/repository modules
    analytics/
    entries/
    exports/
    extraction/
    insights/
    results/
    selfReports/
  platform/http/         shared Express mechanics and error handling
  core/                  cross-module backend types only
  config/                runtime configuration
  db/                    SQLite connection and canonical schema lifecycle

shared/
  contracts/             client/server protocol types
  signal/                pure deterministic rules used by client and server

schema.sql               current canonical backend database schema
test/                    node:test coverage
docs/                    public project docs
```

## Key Patterns

- Vertical ownership: a feature's API, persistence, state, UI, and content live
  together instead of being distributed across global `api`, `lib`, `services`,
  and `components` folders.
- Composition root: `client/src/app` and `server/app.ts` connect modules; domain
  files do not become hidden application orchestrators.
- Shared means shared: only code with multiple real consumers belongs in
  `client/src/shared` or repository-level `shared`.
- One deterministic rule: the Signal mapper lives in `shared/signal` and is
  consumed by both runtimes.
- One runtime vocabulary: Signal v5 and activity-insight enum values live in
  `shared/contracts`; client normalizers and server Zod/provider schemas consume
  those values instead of redefining them.
- Infrastructure boundaries: IndexedDB schema belongs to `platform/storage`;
  feature repositories own their records and encryption envelopes.

- Local-first storage: writing remains useful without the backend.
- Privacy boundary: raw data and textless analytics are separated.
- Repository/service split: SQL access is isolated from business logic.
- Zod contracts: request payloads are validated at runtime.
- Durable queue: retryable work survives reloads.
- Deterministic mapper: final metrics are recomputed from structured evidence.
- Snapshot observations: user-facing insights are persisted and bounded.
- Local hybrid search: keyword/date/tag search and semantic retrieval stay in
  the browser.
- Local RAG evidence packs: private excerpts are inspectable in the browser and
  are not backend inputs.

## Trade-Offs

Athena chooses privacy and local usefulness over cloud convenience.

Benefits:

- raw writing stays under user control;
- the editor remains useful without a reliable backend connection;
- analytics can be inspected as textless, deterministic processing.

Costs:

- sync and recovery logic are more complex;
- backend backups do not contain the user's full diary.
- local semantic indexes and RAG evidence are rebuildable derived data, not
  server-owned state.
