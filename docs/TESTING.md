# Testing Strategy

Athena uses `node:test` and has coverage for core privacy and signal behavior.

## Current Check Commands

```powershell
npm test
npm run server:check
npm run lint
npm run client:build
npm run test:e2e
```

If the normal Vite port is already occupied by a developer session, run the
smoke on another port without stopping it:

```powershell
$env:ATHENA_E2E_CLIENT_PORT = "5174"
npm run test:e2e
```

`npm run release:check` runs all of the above plus dependency audit.

GitHub Actions runs install, unit/integration tests, server type-check, client
lint, client build, and the Playwright smoke flow on pushes and pull requests.

## Covered Areas

Server:

- open API behavior and absence of retired auth mutation routes;
- removal of retired auth tables without resetting other backend data;
- entry create/update/delete without raw text storage;
- idempotent entry create and source hash mismatch;
- entry server-sync policy and source-hash conflict behavior;
- canonical SQLite initialization, fingerprint rejection, and write transaction behavior;
- self-report aggregate API;
- analytics summaries, Analytics V2 summaries, and Insight V3 snapshots.

Client/local:

- vault setup, unlock, credential rotation, and encrypted record persistence;
- IndexedDB entry storage and draft storage;
- queue retry, cancellation, stale running recovery, pruning, and textless
  entry sync jobs;
- self-report event save/delete and aggregate recomputation;
- local search, tag filtering, semantic retrieval, and local RAG evidence packs;
- debug-only entry detail tooltip rendering.

Signal pipeline:

- strict Signal v5 sanitization;
- fallback behavior;
- mapper confidence and null metric reasons.

Results pipeline:

- exact multilingual identity aliases and task/activity classification;
- specific project tags as bounded identity hints;
- pending extraction proposals do not enter Results before user confirmation;
- user corrections are canonical while original extraction remains unchanged;
- rename, merge, split, aliases, tag rules, manual links, and exclusions are reversible;
- a per-item tag rule links matching analyzable entries, excludes entries with
  analysis disabled, and loads old customization records without tag rules;
- day/week facts are deterministic and remain attached to their owning Results item;
- the owning Results item, not Observations, displays its narrative or a phrase-pool fallback;
- activity-review requests omit local ids and labels, enable Google Search, and
  retain only sanitized grounding source links;
- rejection of broad or ambiguous tag-only project candidates;
- deidentified activity-specific context aggregation for insights.

## E2E Smoke Flow

The main product flow is covered by Playwright:

```text
open app
-> create entry
-> add tags
-> add self-report values
-> save
-> find entry in Entries
-> verify self-report daily aggregate sync
```

The smoke uses synthetic test text and a temporary SQLite database.

## Manual Product Smoke

Before a public release, also verify the visible current product shape:

1. Editor opens as the first surface and retains draft text locally.
2. Entries renders as a searchable card grid.
3. Observation history opens as a floating panel and refreshes without sending
   local RAG excerpts to the backend.
4. Results renders one unified list; a row expands by clicking the row itself,
   its source entry tiles retain Entries actions, and its gear opens the
   separate correction panel without adding controls to the primary row.
5. Settings opens as a floating panel with Interface, Access, Records, and Data
   tabs.
