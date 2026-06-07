# ADR-0002: Local-First Offline Architecture

## Status

Accepted.

## Context

Athena's primary action is writing. Writing should not fail just because the backend or network is unavailable.

## Decision

Use IndexedDB as the browser-local source for raw entries and draft state. Add a service worker for app shell caching and a durable IndexedDB operation queue for retryable background work.

## Consequences

Benefits:

- editor remains useful offline;
- queue jobs survive reloads;
- backend outage feels like delayed sync instead of total app failure.

Costs:

- local/backend state must be reconciled carefully;
- queue payloads must avoid raw text;
- Settings needs enough queue visibility to explain delayed work.
