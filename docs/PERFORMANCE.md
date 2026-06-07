# Performance Notes

Athena keeps performance readiness practical: measured checks, conservative guardrails, and known large assets are documented instead of hidden.

## Current Build Snapshot

Latest observed `npm run client:build` output from `npm run release:check` on 2026-06-07:

- CSS bundle: about `36 kB` minified.
- Main app chunk: about `604 kB` minified.
- `transformers.web` chunk: about `551 kB` minified.
- ONNX WASM asset: about `23.6 MB` raw, about `5.8 MB` gzip.

Vite warns that some chunks exceed `500 kB`. This is expected while the optional local emotion ONNX runtime remains available. Future performance work should consider deeper lazy loading or moving the spike behind a stricter debug-only load path.

## Release Checks

Use:

```bash
npm run release:check
```

This runs unit/integration tests, server type-check, client lint, client/server build, Playwright smoke, and dependency audit.

Latest local result: passed on 2026-06-07. The Vite large-chunk warning remains expected while the optional local emotion ONNX runtime is present.

## API Smoke

Recommended self-hosted smoke:

- `GET /config`
- `GET /entries`
- `GET /analytics/summary`
- `GET /exports/backend-metadata`

The export endpoint is expected to scale with metadata size. It is a user/admin export action, not a high-frequency UI polling endpoint.

## Local Dataset Guardrails

Current local search has a synthetic 1,000-entry guardrail in tests. Search is browser-local and avoids backend calls.

Import/export JSON generation is intentionally user-triggered. Large local export files may take noticeable time because they include raw local entries and self-report events.

## Known Follow-Ups

- Keep local emotion runtime lazy-loaded.
- Measure large import/export files before adding merge import.
- Consider chunked streaming only if real export size makes Blob generation uncomfortable.
- Avoid brittle timing thresholds in CI.
