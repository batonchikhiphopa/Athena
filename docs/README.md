# Athena Documentation

This is the public documentation for Athena.

Athena is a privacy-first, local-first daily reflection app with a calm writing
surface and a strict analytical engine underneath. It is not a dashboard,
chatbot, coach, productivity tracker, or medical tool.

The current implementation is:

- a light, paper-like workspace with a narrow icon rail;
- an editor-first writing surface with local autosave, tags, per-entry analysis
  control, and voluntary self-report scales;
- a searchable Entries card grid with always-on local hybrid keyword/date/tag
  and semantic search;
- a unified expandable Results list built from user-confirmed extraction
  proposals, with a separate correction panel for aliases, rename, merge,
  split, type correction, manual links, and reversible exclusions; each item
  owns its compact deterministic day/week facts;
- floating Observations and Settings panels that stay in the current workspace,
  with pending proposals and optional narrative activity reviews included in
  Observations; observation cards are individually deletable;
- raw diary text and raw self-report events stay browser-local, while the
  backend stores textless metadata, signals, aggregates, and snapshots.

## Read First

- [Architecture](./ARCHITECTURE.md) - system shape, project structure, and major trade-offs.
- [Code map](./CODEMAP.md) - generated file catalog with responsibilities, functions, exports, and HTTP routes.
- [Privacy](./PRIVACY.md) - raw-data boundary, extraction boundary, self-report storage, and export/import privacy rules.
- [Export/import](./EXPORT_IMPORT.md) - local_export.v1, backend_metadata_export.v1, validation, and excluded data.
- [Search](./SEARCH.md) - local keyword/semantic search, evidence packs, and privacy boundaries.
- [Signal](./SIGNAL.md) - Signal v5 fields, mapper rules, and textless context.
- [Testing](./TESTING.md) - quality strategy and missing test layers.
- [Performance](./PERFORMANCE.md) - build snapshot, API smoke, and performance follow-ups.
- [Accessibility](./ACCESSIBILITY.md) - primary-flow accessibility checklist.
- [Deployment](./DEPLOYMENT.md) - local and production build commands.
- [Self-Hosting](./SELF_HOSTING.md) - Docker, SQLite volume, backup, and restore.
- [API](./API.md) - endpoint reference and request/response shapes.
- [Contracts](./CONTRACTS.md) - documented payload versions and route-prefix decision.
- [Database schema](./DATABASE_SCHEMA.md) - canonical schema lifecycle, reset policy, and integrity checks.
- [Security](./SECURITY.md) - security summary and audit checklist.
- [Security Checklist](./SECURITY_CHECKLIST.md) - OWASP-style self-check notes.

## ADRs

Architecture Decision Records live in [adr](./adr/):

- [ADR-0001: Privacy Boundary](./adr/0001-privacy-boundary.md)
- [ADR-0002: Local-First Offline Architecture](./adr/0002-local-first-offline.md)
- [ADR-0003: Signal v3 And Deterministic Mapper](./adr/0003-signal-v3-deterministic-mapper.md) - historical decision; current runtime writes Signal v5.
