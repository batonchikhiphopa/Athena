# ADR-0001: Privacy Boundary

## Status

Accepted.

## Context

Athena works with private diary text. Storing raw text on the backend would make analytics easier, but it would also turn the server into a sensitive diary database.

## Decision

Raw diary text stays in the browser. The backend stores only textless metadata, hashes, sanitized signals, self-report daily aggregates, and insight snapshots.

## Consequences

Benefits:

- stronger privacy story;
- local writing works without server availability;
- backend analytics can be audited as textless processing.

Costs:

- sync is more complex;
- extraction must be current-entry-only;
- backend backup is not a full diary export.

## Alternatives Considered

Full cloud diary storage:

- rejected because it violates the product's privacy posture.

Client-side encryption with cloud raw-text blobs:

- deferred because multi-device sync and key management need a separate design.
