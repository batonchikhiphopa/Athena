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
- SQLite migration and write transaction behavior;
- self-report aggregate API;
- analytics summaries and insight snapshots.

Client/local:

- vault setup, unlock, rotation, and migration;
- IndexedDB entry storage and draft storage;
- queue retry, cancellation, stale running recovery, pruning;
- self-report event save/delete and aggregate recomputation;
- local search and tag filtering.

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
