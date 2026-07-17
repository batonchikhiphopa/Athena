# Performance Notes

Athena keeps performance readiness practical: measured checks, conservative guardrails, and known large assets are documented instead of hidden.

## Current Build Snapshot

Reference `npm run client:build` output from 2026-07-17:

- Main app chunk: about `679 kB` minified / `195 kB` gzip.
- Settings chunk: about `52 kB` minified / `13 kB` gzip.
- CSS bundle: about `58 kB` minified / `11 kB` gzip.

The main application chunk can still exceed Vite's default `500 kB` warning
threshold. Measure route and feature ownership before introducing more code
splitting.

## Release Checks

Use:

```bash
npm run release:check
```

This runs unit/integration tests, server type-check, client lint, client/server build, Playwright smoke, and dependency audit.

Record a new dated build snapshot here after meaningful dependency or route
changes.

## API Smoke

Recommended self-hosted smoke:

- `GET /config`
- `GET /entries`
- `GET /analytics/v2/summary`
- `GET /insights`
- `GET /exports/backend-metadata`

The export endpoint is expected to scale with metadata size. It is a user/admin export action, not a high-frequency UI polling endpoint.

## Backend Audit — 2026-07-17

The release checks are green, and the current SQLite indexes support the latest
signal lookup and date-window queries. The main remaining backend work is query
and write amplification rather than a single broken query.

Priorities:

1. Cache current insight snapshots by an evidence fingerprint. Today
   `/insights/current` evaluates day, week, and month sequentially, rebuilds
   overlapping Analytics V2 windows, and upserts snapshots again even when the
   evidence did not change.
2. Stop writing `auth_sessions.last_seen_at` on every authenticated request.
   Throttle the touch or update it once per coarse interval so protected reads
   do not become SQLite writes.
3. Replace full-history `GET /entries` refreshes with revision-based delta sync.
   Cursor pagination alone is not a good fit because local search and Results
   deliberately operate over the complete browser-local archive.
4. Benchmark runtime SQLite settings under the self-hosted workload. The app
   currently enables foreign keys but not a runtime busy timeout; WAL,
   `busy_timeout`, and `BEGIN IMMEDIATE` are candidates, not defaults to switch
   without measuring backup and contention behavior.
5. Add immutable cache headers for hashed `/assets/*` files and keep the SPA
   document uncached or revalidated. Compression is better handled by the
   reverse proxy or precompressed assets than by spending Express CPU per
   request.

The first implementation target should be insight fingerprinting plus a single
shared analytics range read, because it removes repeated database work from a
normal app refresh without changing the client data model.

## Local Dataset Guardrails

Current local search has a synthetic 1,000-entry guardrail in tests. Hybrid
keyword/date/tag and semantic search is browser-local and avoids backend calls.

Import/export JSON generation is intentionally user-triggered. Large local export files may take noticeable time because they include raw local entries and self-report events.

## Known Follow-Ups

- Measure large import/export files before adding merge import.
- Consider chunked streaming only if real export size makes Blob generation uncomfortable.
- Avoid brittle timing thresholds in CI.
