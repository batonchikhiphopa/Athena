# Changelog

All notable changes to Athena are documented here.

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
