# Changelog

All notable changes to Athena are documented here.

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

