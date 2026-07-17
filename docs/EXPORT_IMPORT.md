# Export And Import

Athena export/import is a data ownership feature, not cloud sync.

The contract has two separate export surfaces:

- `local_export.v1` - a browser-local JSON package created by direct user action. It may contain raw diary text because it is the user's explicit private export.
- `backend_metadata_export.v1` - a backend JSON export for self-hosted metadata. It must remain textless and must not be treated as a full diary backup.

This document defines the current export/import contract. Athena is in active
development, so imports must match the active contract exactly.

## Current Contract Versions

Current runtime versions used by this contract:

```ts
const ACTIVE_SCHEMA_VERSION = "signal.v5";
const ACTIVE_PROMPT_VERSION = "extraction.v7";
const SELF_REPORT_SCHEMA_VERSION = "self_report.v1";
const SELF_REPORT_DAILY_AGGREGATE_VERSION = "self_report_daily_aggregate.v1";
```

Backend routes remain unversioned. Export/import versions live inside payload fields.

## Privacy Rules

Non-negotiable rules:

- Local export files are created only after explicit user action.
- Local export must never be silently uploaded.
- Local export may include raw diary text and raw local self-report events.
- Backend export/import endpoints must remain textless.
- Backend metadata export must not contain raw diary text or raw self-report events.
- Import must validate `app`, `export_version`, required shapes, dates, ids, and versions before writing.
- Import preview must not write data and must not call the backend.
- Import apply must not merge untrusted raw fields into backend APIs.
- Queue export must use a whitelist summary type. It must never export raw queue payloads.
- Export code must not log raw export payloads, raw diary text, raw self-report answers, vault plaintext, or provider secrets.

## Local Export Contract

### Type

```ts
type AthenaLocalExportV1 = {
  app: "athena";
  export_version: "local_export.v1";
  exported_at: string;
  source: {
    app_version: string | null;
    schema_version: "signal.v5";
    prompt_version: "extraction.v7";
    self_report_schema_version: "self_report.v1";
    self_report_daily_aggregate_version: "self_report_daily_aggregate.v1";
  };
  entries: LocalExportEntryV1[];
  self_reports: {
    events: LocalExportSelfReportEventV1[];
  };
  settings: LocalExportSettingsV1;
  queue: {
    pending_jobs: QueueExportSummaryV1[];
  };
};

type LocalExportEntryV1 = {
  id: string;
  server_id: number | null;
  text: string;
  entry_date: string;
  tags: string[];
  analysis_enabled: boolean;
  created_at: string;
  updated_at: string;
  source_text_hash: string | null;
  signal: unknown | null;
  metadata: unknown | null;
};

type LocalExportSelfReportEventV1 = {
  id: string;
  entry_id: string;
  local_day: string;
  created_at: string;
  updated_at: string;
  values: {
    mood: number | null;
    stress: number | null;
    energy: number | null;
    sleep_quality: number | null;
    function: number | null;
  };
  schema_version: "self_report.v1";
};

type LocalExportSettingsV1 = {
  extraction_provider?: "ollama" | "gemini" | "off";
  extraction_model?: string;
  interface_language?: string;
  entry_sort_direction?: "asc" | "desc";
  persona_text_enabled?: boolean;
};

type QueueExportSummaryV1 = {
  type:
    | "entry.sync"
    | "entry.reprocess_signal"
    | "self_report.sync_daily_aggregate";
  entity_kind: string | null;
  entity_id: string | null;
  status: "queued" | "running" | "blocked" | "failed";
  reason?: string;
};
```

### Included Data

`local_export.v1` includes:

- local entries, including raw diary text;
- entry dates;
- tags;
- analysis toggles;
- existing `source_text_hash` values;
- latest local signal copy and extraction metadata, when present;
- raw local self-report events;
- selected non-secret local settings;
- queue-safe pending job summaries.

### `source_text_hash` Decision

`source_text_hash` is included in `local_export.v1` as integrity and linkage metadata.

It is not raw diary text, but it is a fingerprint of raw diary text. If the export file leaks and the same text appears elsewhere, the hash can help prove that the exported entry matches that text. The field must not be described as anonymous or harmless.

Rules:

- Export only the existing stored hash.
- Do not recompute hashes during export unless a future migration explicitly requires it.
- Do not use `source_text_hash` as a public id.
- Treat the whole local export file as sensitive private data.

### Queue Export Whitelist

Queue export must use `QueueExportSummaryV1`, not `QueueJob`, not `QueueJobSummary`, and not a redacted payload object.

Allowed queue fields:

- `type`;
- `entity_kind`;
- `entity_id`;
- `status`;
- optional high-level `reason`.

Forbidden queue fields:

- `payload`;
- `idempotency_key`;
- `source_text_hash`;
- `local_revision`;
- `run_after`;
- `locked_at`;
- `attempts`;
- `max_attempts`;
- `last_error`;
- provider/model details;
- raw diary text;
- raw self-report answers;
- raw self-report event arrays.

Reason: queue jobs are durable processing state. The export contract must not expose retry/debug details or accidentally duplicate private data.

### Excluded Data

`local_export.v1` must not include:

- server auth session cookies;
- CSRF tokens;
- session token hashes;
- password hashes;
- vault passwords;
- vault keys or key material;
- provider API keys;
- raw queue payloads;
- hidden browser caches;
- service worker caches;
- provider/debug payloads;
- semantic indexes or embeddings;
- RAG snippets or evidence packs;
- hidden model memory.

Semantic indexes, local hashed embeddings, retrieved chunks, and RAG evidence
packs are sensitive derived data. The current semantic search implementation
keeps them browser-local and rebuildable from imported entries; export still
excludes them. A future export option would need an explicit privacy review and
separate user action.

## Exported File Security Limitation

When local app protection is enabled, entries and self-report records may be stored in encrypted vault envelopes inside IndexedDB.

`local_export.v1` v1 is a plaintext JSON export created after explicit user action and, when required, vault unlock. After the browser downloads the file, Athena cannot protect that file.

The product copy should make this limitation clear:

```text
This export may contain diary text and raw local self-report data. After download, Athena cannot protect the file. Store it carefully or encrypt it yourself.
```

Deferred improvement:

- password-protected export archive;
- encrypted local export package;
- optional split export without raw text.

These are not part of `local_export.v1`.

## Local Import Contract

### Accepted Input

The importer accepts JSON only.

The package must have:

```json
{
  "app": "athena",
  "export_version": "local_export.v1"
}
```

Unsupported versions must be rejected with a clear error.

### Validation Requirements

Before writing anything, import must validate:

- top-level `app`;
- top-level `export_version`;
- `exported_at` as a valid date string;
- known source version fields;
- entries array;
- entry ids as non-empty strings;
- entry text as a string;
- `entry_date` as a local `YYYY-MM-DD` date;
- tags as string arrays;
- timestamps as valid date strings where present;
- self-report event ids as non-empty strings;
- self-report `local_day` as a local `YYYY-MM-DD` date;
- self-report values as `0..10` integers or `null`;
- queue summaries as the `QueueExportSummaryV1` whitelist only.

Validation must reject or flag:

- malformed JSON;
- unsupported export versions;
- missing required fields;
- invalid dates;
- duplicate entry ids;
- duplicate self-report ids;
- forbidden secret fields;
- raw queue payloads;
- backend-shaped raw fields that should never be sent to the server.

### Preview Requirements

Import preview must be pure inspection.

It must show at least:

- entries count;
- self-report event count;
- date range;
- possible duplicate ids;
- whether current local data exists;
- export version;
- warnings for sensitive/plaintext data.

Preview must not:

- write local storage;
- call the backend;
- enqueue jobs;
- recompute aggregates;
- mutate current app state beyond preview UI state.

### Apply Requirements

First implementation uses one mode only:

```text
replace local data
```

Merge-by-id is deferred until conflict semantics are designed and tested.

Apply must:

1. require explicit confirmation from preview state;
2. clear replaceable local entry and self-report stores;
3. write imported entries through local storage APIs;
4. write imported raw self-report events through self-report storage APIs;
5. recompute self-report daily aggregates from imported raw events;
6. recreate only safe queue jobs where needed;
7. avoid importing server auth state;
8. avoid backend calls with raw text.

Imported self-report aggregate caches must not be trusted. Aggregates are derived data and must be recomputed locally.

## Backend Metadata Export Contract

Backend metadata export is not a full diary backup because SQLite does not contain raw diary text.

### Endpoint

```http
GET /exports/backend-metadata
```

Auth and CSRF behavior should match existing protected read routes.

### Type

```ts
type AthenaBackendMetadataExportV1 = {
  app: "athena";
  export_version: "backend_metadata_export.v1";
  exported_at: string;
  source: {
    app_version: string | null;
    schema_version: "signal.v5";
    prompt_version: "extraction.v7";
    self_report_schema_version: "self_report.v1";
    self_report_daily_aggregate_version: "self_report_daily_aggregate.v1";
    backend_schema_version: string | null;
  };
  entries: unknown[];
  signals: unknown[];
  effective_signals: unknown[];
  signal_overrides: unknown[];
  self_report_daily_aggregates: unknown[];
  insight_snapshots: unknown[];
};
```

### Included Data

Backend metadata export may include:

- textless entry metadata;
- tags;
- `source_text_hash`;
- sanitized signal rows;
- effective signal read models;
- signal overrides, if currently supported;
- self-report daily aggregate rows;
- insight snapshots;
- contract and schema versions.

### Excluded Data

Backend metadata export must not include:

- raw diary text;
- raw self-report answers;
- raw self-report event timestamps;
- server session cookies;
- CSRF tokens;
- session token hashes;
- password hashes;
- provider API keys;
- raw extraction request text;
- provider prompts containing raw text;
- RAG snippets or private note chunks.

### Versioning Strategy

`backend_metadata_export.v1` must include a `source` block from the first implementation.

The route path may stay unversioned, but the payload version must be explicit. Importers and future tools must key off `export_version` and `source.*_version`, not route names.

Version fields should come from existing runtime constants where possible, especially:

- `ACTIVE_SCHEMA_VERSION`;
- `ACTIVE_PROMPT_VERSION`;
- self-report schema constants;
- migration or backend schema metadata when available.

## CSV Decision

CSV export is deferred unless the implementation is explicitly scoped to safe aggregate/metadata data.

Allowed future CSVs:

- self-report daily aggregates;
- analytics summary rows;
- backend entry metadata without text;
- signal metrics and versions.

Not allowed by default:

- raw diary text CSV;
- raw self-report event CSV;
- provider/debug payload CSV;
- queue payload CSV.

Raw diary CSV requires a separate explicit local-only option, warning copy, and tests.

## Integrations Decision

Integrations are deferred future work.

Out of scope for the current export/import contract:

- iCal;
- webhooks;
- Apple Health;
- Google Fit;
- wearables;
- passive sensors;
- geolocation;
- contacts;
- plugin-style integrations.

Any future integration requires a privacy review covering:

- data categories;
- purpose;
- consent UX;
- revocation;
- local/cloud exposure;
- export/delete behavior;
- threat model;
- whether data can reveal health-adjacent or diary-derived information.
