# Changelog

All notable changes to Athena are documented here.

## Unreleased

## v0.9.1 - 2026-07-19

### Changed

- Replaced backend migration history with one fingerprinted canonical SQLite
  schema that initializes only fresh databases.
- Backend startup now performs a constant-size schema check instead of scanning
  and validating every historical migration.
- Backend API access is temporarily unauthenticated; the browser-local vault and
  its optional passphrase remain unchanged.
- Moved deterministic day/week activity facts from the global Observations feed
  into their owning Results items. Every saved observation card has an
  Entries-style delete action.
- Kept the Results fact tile strictly informational. Missing narrative reviews
  now use ordinary prose from Athena's shared phrase pool in the owning Results
  item, while formulated reviews cover the situation, a desirable action, and
  optional Google-Search-grounded advice with visible source links. Observations
  no longer duplicates activity reviews or treats them as unread observations.
- Results item settings now uses the global Settings icon in a round button, and
  extraction UI calls automatic output “Automatically extracted” instead of
  “Machine proposal”.
- Results item settings now supports reversible automatic entry links from
  user-selected tags. Tag matching is local and ignores entries with analysis
  disabled; the round row settings control is also smaller.
- Bumped root, client, lockfile, and exported app metadata versions to `0.9.1`.

### Removed

- Removed all incremental backend migration files and compatibility with older
  development database schemas; `npm run db:reset` explicitly recreates the
  current textless backend database.
- Removed owner login, sessions, CSRF enforcement, Argon2, auth UI, and the
  `auth_users` / `auth_sessions` tables. The exact preceding schema drops only
  those two tables in place on first startup.

## v0.9.0 - 2026-07-17

### Added

- Added Results as a single evidence-backed view of projects, finite tasks, and
  recurring activities extracted from local diary entries.
- Added encrypted local activity-insight caching and one privacy-bounded batched
  Gemini refresh per day.
- Added Signal v5 activity-specific context for outcomes, blockers, strategies,
  next-step clarity, agency, and links to strain or recovery.
- Added shared unread notifications for observations and activity insights.

### Changed

- Results rows now expand smoothly by clicking the row and keep the original
  activity graph plus compact entry cards in the expanded view.
- Project tags can stabilize an activity identity when the entry also contains
  task or project evidence; broad and ambiguous tags remain insufficient.
- Activity aliases are normalized across supported languages without general
  fuzzy merging.
- Bumped root, client, lockfile, and exported app metadata versions to `0.9.0`.

### Removed

- Removed the browser-local ONNX emotion demo, its Settings controls, extraction
  hook, tests, and `@huggingface/transformers` runtime dependency.
- Removed the emotion-demo setting from the local export/import contract.
- Removed the superseded `/analytics/summary` route and its separate legacy
  observation generator; `GET /analytics/v2/summary` is the only analytics API.
- Local import now accepts only the active Signal and extraction contract.
- Removed plaintext IndexedDB, localStorage draft, and Vault config v2 migration
  paths; the current vault format is the only local persistence format.
- Results no longer approximates activity-specific impact from entry-level
  `load`, `fatigue`, and `focus`; it uses current `activity_contexts` only.
- Removed topic recovery from historical snapshot prose.
- Signal validation no longer fills fields from older schemas; every current
  Signal payload must provide the complete Signal v5 shape.
- Removed unused queue job variants and the orphaned legacy analytics repository.
- Removed the unused `emotion_signals` field from Signal, persistence, mapping,
  prompts, debug output, and the effective-signal read model.

## v0.8.3 - 2026-07-12

### Changed

- Reorganized the client into feature-owned modules with explicit `shared` and `platform` boundaries.
- Reorganized the backend into vertical `analytics`, `auth`, `entries`, `exports`, `extraction`, `insights`, and `selfReports` modules.
- Split the former global API, storage, vault, import, Entries UI, and Analytics V2 modules into smaller focused files.
- Co-located feature UI, persistence, API adapters, types, and content with the behavior they support.
- Replaced duplicate client/server Signal mapping with one shared pure mapper.
- Updated the architecture guide and generated code map for the new module ownership and file layout.
- Bumped root, client, lockfile, and exported app metadata versions to `0.8.3`.

### Fixed

- Updated the locked transitive `protobufjs` dependency to a patched release after the pre-release security audit.

### Notes

- This release is an internal architecture refactor; user-facing behavior is intended to remain unchanged.
- No database migration, payload contract bump, or privacy-boundary change is included.
- Raw diary text remains browser-local.

## v0.8.0 - 2026-06-13

### Added

- Added always-on hybrid Entries search with local semantic retrieval through deterministic hashed embeddings.
- Added browser-local RAG evidence packs and constrained local interpretation with explicit evidence ids.
- Added Insight V3 evidence-backed observation rendering over Analytics V2 summaries.
- Added self-report values to the contextual Entries debug tooltip.
- Added test coverage for the week observation sufficiency threshold.

### Changed

- Bumped root and client package versions to `0.8.0`.
- Made Entries search hybrid by default and removed the user-facing search-mode switch.
- Lowered week observation sufficiency from 4 to 3 distinct valid days in the last 7 calendar days.
- Updated README, public docs, and production canon notes for hybrid search, local evidence packs, Insight V3, and current observation rules.

### Fixed

- Fixed an observability gap where per-entry raw self-report values were attached locally but not visible in debug mode.
- Fixed the current-week observation gate that stayed silent for three supported days even though that is enough for a lightweight weekly observation.

## v0.7.0 - 2026-06-07

### Added

- Added Signal v4 context contracts and migration coverage.
- Added browser-local JSON export/import in Settings with preview validation and replace-local-data apply.
- Added backend textless metadata export at `/exports/backend-metadata`.
- Added Playwright smoke coverage for Settings data export/import.
- Added Docker and compose self-hosting artifacts.

### Changed

- Bumped root and client package versions to `0.7.0`.
- Aligned local, CI, and Docker runtime policy on Node 24.
- Kept root `dist/` and client build artifacts out of release commits.
- Moved TypeScript build metadata out of `client/node_modules/.tmp`.
- Made server builds clear stale `dist/server` output before compiling.
- Moved Playwright's API server off port `3000` to avoid local dev conflicts.

### Notes

- Release verification still needs full tests in CI or a clean non-sandboxed shell if the local environment blocks child-process spawns.

## v0.6.0 - 2026-06-01

### Added

- Added optional self-report state sliders in the Editor prototype flow.
- Added browser-local self-report storage and daily aggregate recomputation.
- Added `self_report.sync_daily_aggregate` queue handling for syncing numeric aggregates without raw self-report event data.
- Added SQLite storage and API routes for self-report daily aggregates.
- Added self-report aggregate contract coverage for strict server payloads.

### Changed

- Bumped root and client package versions to `0.6.0`.
- Aligned Express/Node type packages with the Express 4 and Node 24 runtime versions, and updated Vite to the latest 8.0 patch.
- Added the `/self-reports` Vite dev proxy route.
- Made server authentication optional through `ATHENA_AUTH_REQUIRED`; passwordless local API access is the default, and strict owner login remains available when enabled.
- Reworked app access into a zero-friction local lock: first launch opens the editor immediately, Settings exposes one app-protection toggle, and vault credential details stay hidden from the UI.
- Stripped client-local aggregate IDs before syncing self-report aggregate payloads.
- Updated README route, migration, privacy, and queue documentation for the current repository state.

### Notes

- Self-report sync sends daily numeric aggregates only; raw diary text and per-entry self-report events remain browser-local.

## v0.5.0 - 2026-05-31

### Added

- Added Sprint 3f release hygiene with README cleanup, future migration filename renumbering, and release-check scripts.
- Added Sprint 3b Signal Contract v3 with structured `state_inference`, `emotion_signals`, `metric_confidence`, and `quality_reason`.
- Added a deterministic signal mapper that recomputes `load`, `fatigue`, `focus`, metric confidence, quality reason, and signal quality from structured state inference.
- Added SQLite storage for Signal v3 JSON detail columns while preserving the existing metric columns for analytics.
- Added DebugPanel visibility for state inference, metric confidence, quality reason, and null metric explanations.
- Added Sprint 3c queue-backed Signal v3 extraction/reprocess jobs for saved local entries.
- Added explicit reprocess reasons for `fallback`, `sparse_no_metrics`, `provider_failure`, and `manual_reprocess`.
- Added queue visibility for latest job type, status, and reason.
- Added Sprint 3c policy coverage for stale queued payloads, legacy v2 entries, provider failures, and sparse metric-empty signals.
- Added Sprint 3d local ONNX Web emotion spike with an opt-in debug Settings demo.
- Added `@huggingface/transformers` to the client for browser-side ONNX emotion inference.
- Added a local emotion privacy guard that fails the spike if raw diary text appears in model artifact requests.
- Added Sprint 3e emotion-aware deterministic mapping with bounded local emotion adjustments.
- Added mapper coverage proving emotion evidence cannot create final metrics without state evidence.

### Changed

- Bumped the app package version to `0.5.0`.
- Bumped active extraction contracts to `signal.v3` and `extraction.v4`.
- Updated extraction prompts and provider JSON schema to request Signal v3 output from a single-entry attentive-reader framing.
- Made new signal API payloads strict v3-only while preserving read compatibility for legacy stored rows.
- Moved pending extraction/reprocess flow onto durable `entry.reprocess_signal` jobs that read latest local source at execution time.
- Expanded Settings reprocess candidates beyond fallback to include metric-empty sparse signals, retryable provider failures, and legacy schema/prompt rows.
- Kept retryable provider failures as queue/provider state instead of appending fallback signals over usable entries.
- Local emotion output now remains secondary evidence: it can nudge existing state-derived `load`, `fatigue`, and `focus` by a bounded amount, but cannot directly create final metrics.
- DebugPanel now shows the emotion-aware mapper decision next to emotion evidence in debug mode.
- Lazy-loaded secondary tab surfaces so the editor path stays lighter.
- Removed stale built-app launcher references from README and project structure notes.
- Renumbered planned future migrations after the Signal v3 migration.

### Notes

- The preferred CEDR emotion model remains documented as the candidate, but the runnable 3d spike uses the ONNX-compatible `onnx-community/tanaos-emotion-detection-v1-ONNX` model because the CEDR candidate does not currently expose compatible ONNX files.
- Semantic indexing, self-report queue handlers, and full background sync remain later work.
- Extraction still does not emit baseline deviation, trend, or history-aware fields.

## v0.4.0 - 2026-05-12

### Added

- Added Sprint 3a durable operation queue infrastructure backed by IndexedDB.
- Added generic queue job types, persisted job status, retry/backoff, cancellation, stale running job recovery, pruning, queue size limits, and idempotency-key coalescing.
- Added queue health and controls in Settings, including queued/running/failed/blocked counts, processor state, last error, pause/start, and retry failed jobs.
- Added queue-backed fallback reprocessing through `entry.reprocess_signal` without storing raw diary text in queue payloads.
- Added SQLite write-concurrency coverage and idempotent duplicate entry create tests.

### Changed

- Bumped the app package version to `0.4.0`.
- Migrated the server runtime source to TypeScript with `tsx` development/test execution and server type checking.
- Serialized SQLite write transactions to avoid nested transaction failures on concurrent requests.
- Made `POST /entries` idempotent by `client_entry_id` when `source_text_hash` matches.
- Kept source hash mismatch as a real conflict instead of hiding it as normal sync failure.
- Updated docs to describe the current Sprint 3a reliability layer and its remaining limits.

### Notes

- Sprint 3a is reliability-only: later Signal Contract v3, local emotion inference, and semantic indexing were not included in v0.4.0.
- Queue payloads reference local source records and must not duplicate raw diary text.
- Background sync and full autosave-backed remote sync are still out of scope for this release.

## v0.3.0 - 2026-05-03

### Added

- Added Sprint 2 local retrieval for Entries: debounced text/date/tag search, included tag filters, available tag counts, filter reset, and quiet no-results state.
- Added pure entry search/filter helper coverage for query normalization, tag normalization, AND/NOT tag filtering, stale tag filter pruning, search ranking, and stable empty-search ordering.
- Added manual tag controls in Editor, including visible tag chips, editable/removable tags, `#` insertion, and local tag autocomplete from existing tags.
- Added per-entry analysis permission controls through eye buttons in Editor and Entries.
- Added browser-local Gemini daily extraction accounting with a 20-request daily limit.

### Changed

- Bumped the app package version to `0.3.0`.
- Editor tags are now first-class local draft state instead of being extracted implicitly from text alone.
- Entries now keeps selected entries stable while search/filter state changes.
- Entries clears selected tag filters when the last matching local tag disappears.
- Pending extraction and fallback reprocessing skip entries whose analysis is disabled.
- Fallback reprocessing with Gemini respects the remaining local daily quota and avoids writing a new fallback over an existing fallback when quota is exhausted.

### Notes

- The analysis eye is a consent control for text analysis, not an LLM tag suggestion feature.
- Disabling analysis for an already synced entry removes its textless server entry and leaves the raw text local.
- The Gemini daily counter is browser-local and resets by local calendar date.

## v0.2.0 - 2026-05-01

### Added

- Added an offline-first app shell with service worker caching for the app shell, `index.html`, and same-origin static assets.
- Added browser online/offline tracking and network status display in Settings.
- Added graceful API degradation for entry and insight list reads so the writing surface remains usable while offline or while the backend is unavailable.
- Added first-class context markers for sparse signals, including `sleep_issue`, `health_issue`, `recovery_need`, and `late_night_ideas`.
- Added shared marker definitions and Russian marker labels for analytics and observation text.
- Added tests for sparse marker visibility and context marker sanitization.

### Changed

- Bumped the app package version to `0.2.0`.
- Bumped the active signal schema and extraction prompt contract to `signal.v2` and `extraction.v2`.
- Updated analytics to keep marker ordering deterministic with marker-specific priority.
- Updated observation generation so sparse/context markers can still appear when numeric signal density is low.
- Refined the editor with a local text visibility toggle.
- Moved Settings to the bottom of the navigation and refreshed the observations icon.

### Notes

- Raw diary text remains browser-local. The backend stores textless metadata, hashes, sanitized signals, analytics aggregates, and insight snapshots.
- The offline layer is an app shell and local-writing improvement, not a full sync queue or multi-device sync system.
