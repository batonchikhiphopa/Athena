# Changelog

All notable changes to Athena are documented here.

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

- Sprint 3a is reliability-only: Signal Contract v3, local emotion inference, and semantic indexing remain future work.
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
