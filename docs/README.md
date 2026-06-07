# Athena Documentation

This is the public documentation for Athena.

Athena is a privacy-first, local-first reflection app with a calm writing surface and a strict analytical backend.

## Read First

- [Architecture](./ARCHITECTURE.md) - system shape, project structure, and major trade-offs.
- [Privacy](./PRIVACY.md) - raw-data boundary, extraction boundary, self-report storage, and export/import privacy rules.
- [Export/import](./EXPORT_IMPORT.md) - local_export.v1, backend_metadata_export.v1, validation, and excluded data.
- [Search](./SEARCH.md) - local-only entry search, ranking, and semantic-search boundaries.
- [Signal](./SIGNAL.md) - Signal v4 fields, mapper rules, and textless context.
- [Testing](./TESTING.md) - quality strategy and missing test layers.
- [Readiness](./READINESS.md) - 1.0 readiness status, final checks, and known limitations.
- [Performance](./PERFORMANCE.md) - build snapshot, API smoke, and performance follow-ups.
- [Accessibility](./ACCESSIBILITY.md) - primary-flow accessibility checklist.
- [Deployment](./DEPLOYMENT.md) - local and production build commands.
- [Self-Hosting](./SELF_HOSTING.md) - Docker, SQLite volume, backup, and restore.
- [API](./API.md) - endpoint reference and request/response shapes.
- [Contracts](./CONTRACTS.md) - documented payload versions and route-prefix decision.
- [Migrations](./MIGRATIONS.md) - migration lifecycle, integrity checks, and rollback stance.
- [Security](./SECURITY.md) - security summary and audit checklist.
- [Security Checklist](./SECURITY_CHECKLIST.md) - OWASP-style self-check notes.

## ADRs

Architecture Decision Records live in [adr](./adr/):

- [ADR-0001: Privacy Boundary](./adr/0001-privacy-boundary.md)
- [ADR-0002: Local-First Offline Architecture](./adr/0002-local-first-offline.md)
- [ADR-0003: Signal v3 And Deterministic Mapper](./adr/0003-signal-v3-deterministic-mapper.md)
