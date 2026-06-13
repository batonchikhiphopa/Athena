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

`npm run release:check` runs all of the above plus dependency audit.

GitHub Actions runs install, unit/integration tests, server type-check, client
lint, client build, and the Playwright smoke flow on pushes and pull requests.

## Covered Areas

Server:

- auth setup, login, logout, expired sessions;
- CSRF protection for mutating requests;
- entry create/update/delete without raw text storage;
- idempotent entry create and source hash mismatch;
- entry server-sync policy and source-hash conflict behavior;
- SQLite migration and write transaction behavior;
- self-report aggregate API;
- analytics summaries, Analytics V2 summaries, and Insight V3 snapshots.

Client/local:

- vault setup, unlock, rotation, and migration;
- IndexedDB entry storage and draft storage;
- queue retry, cancellation, stale running recovery, pruning, and textless
  entry sync jobs;
- self-report event save/delete and aggregate recomputation;
- local search, tag filtering, semantic retrieval, and local RAG evidence packs;
- debug-only entry detail tooltip rendering.

Signal pipeline:

- strict Signal v4 sanitization;
- fallback behavior;
- mapper confidence and null metric reasons;
- local emotion evidence cannot create metrics by itself.

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
4. Settings opens as a floating panel with Interface, Access, Records, and Data
   tabs.
