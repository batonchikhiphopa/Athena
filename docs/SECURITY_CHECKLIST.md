# Security Checklist

This is a project self-check, not a third-party audit or certification.

## Injection

Current controls:

- API request bodies use strict Zod validation.
- SQLite writes use parameterized queries.
- The backend starts only with the current fingerprinted `schema.sql`; schema
  initialization is atomic and non-canonical databases are rejected.

Residual risk:

- Raw SQL still exists in repositories and export services; review is required when adding new queries.

## Backend Access

Current controls:

- The backend binds to `127.0.0.1` by default.
- The browser-local vault remains independent and can require a passphrase.
- API payloads remain strict and textless even though access is unauthenticated.

Residual risk:

- Any process or user that can reach the bound backend interface can read and
  mutate backend metadata.
- Deployments on `0.0.0.0` require an external trusted network boundary or
  authenticated reverse proxy.
- Athena is not a multi-user permission system.

## XSS

Current controls:

- UI is rendered through React.
- Search snippets render text segments, not `dangerouslySetInnerHTML`.
- Import preview displays parsed metadata, not executable content.

Residual risk:

- Any future rich-text renderer must receive a separate XSS review.

## Sensitive Data Exposure

Current controls:

- Backend entry APIs reject raw diary text.
- Backend SQLite has no raw diary text column.
- `local_export.v1` is explicit user-owned plaintext export.
- `backend_metadata_export.v1` is textless.
- Queue export uses whitelisted summaries and excludes payloads.
- Semantic indexes, local embeddings, retrieved chunks, and RAG evidence packs
  stay browser-local and are excluded from silent export/backend sync.

Residual risk:

- `source_text_hash` is fingerprint metadata and not anonymous.
- Downloaded local export files are outside Athena's protection.
- Local semantic/RAG derived data can reveal meaning even when it is not raw
  text; future persistence or cloud use needs a privacy review.

## Logging

Current controls:

- Export/import code does not intentionally log raw payloads.
- Provider failures are typed and summarized for queue state.

Residual risk:

- Developer console logs should be reviewed before release whenever extraction/provider code changes.

## Dependencies

Current controls:

- `npm run audit` is part of `npm run release:check`.
- Client and server builds are reproducible through npm scripts.

## Import/Export

Current controls:

- Import validates package version and shape before writing.
- Import preview performs no writes and no backend calls.
- Import apply uses replace-local-data mode and recomputes self-report aggregates.
- The canonical backend schema contains no auth/session tables.

Residual risk:

- Imported `signal` and `metadata` are currently JSON-shaped local data; future versions should normalize them through the same signal normalizer used elsewhere.

## Provider Keys And Text Exposure

Current controls:

- Provider `off` sends no model request.
- Ollama is the local-first provider path.
- Gemini sends only the current entry text when analysis is enabled.
- Export excludes provider API keys.

Residual risk:

- Cloud provider use exposes current entry text to that provider.
