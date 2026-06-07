# Readiness Report

Athena is through the production-readiness phases for v0.7.0. `npm run release:check` passed in this workspace on 2026-06-07.

## Current Contracts

- Signal schema: `signal.v4`
- Extraction prompt: `extraction.v5`
- Local export: `local_export.v1`
- Backend metadata export: `backend_metadata_export.v1`
- Self-report event schema: `self_report.v1`
- Self-report aggregate schema: `self_report_daily_aggregate.v1`

## Data Ownership

Implemented:

- Browser-local JSON export from Settings.
- Import validation and preview.
- Replace-local-data import apply.
- Self-report aggregate recomputation after import.
- Backend textless metadata export at `GET /exports/backend-metadata`.

Deferred:

- Merge import.
- Encrypted export archive.
- CSV export beyond documented safe future scope.
- Integrations and plugin system.

## Security

See:

- [Security Notes](./SECURITY.md)
- [Security Checklist](./SECURITY_CHECKLIST.md)

Known limitations:

- Server auth can be disabled for local passwordless mode.
- Downloaded local exports are plaintext.
- Gemini exposes current entry text to the Gemini API when selected.
- Athena is not a clinical or regulated medical product.

## Performance

See [Performance Notes](./PERFORMANCE.md).

The largest known asset is the optional local emotion ONNX runtime. The app keeps it lazy-loaded, but bundle/runtime size should be revisited before adding more local ML features.

## Accessibility

See [Accessibility Checklist](./ACCESSIBILITY.md).

Manual keyboard and label checks are part of pre-release review. Automated axe coverage is deferred.

## Final Verification

Run:

```bash
npm run release:check
```

Latest local result: passed on 2026-06-07 with unit/integration tests, server type-check, client lint, client/server build, Playwright smoke, and dependency audit.

Manual smoke:

- create a synthetic entry with tags and self-report values;
- export local JSON from Settings > Data;
- import the JSON into cleared local data;
- verify entries and self-report aggregates return;
- call `GET /exports/backend-metadata` and confirm the response is textless;
- keyboard through Editor, Entries, Settings, auth/vault gates, and import/export controls.
