# Contracts And Versioning

Athena uses documented contract versions instead of a route prefix such as `/api/v1`.

This keeps the current API stable for the client while making payload evolution explicit. Route names describe resources; payload fields describe contract versions.

## Current Versions

| Contract | Current version | Where it appears |
| --- | --- | --- |
| Signal schema | `signal.v4` | signal metadata, config response, analytics version summaries |
| Extraction prompt | `extraction.v5` | signal metadata, config response, analytics version summaries |
| Self-report event schema | `self_report.v1` | local aggregate inputs |
| Self-report daily aggregate | `self_report_daily_aggregate.v1` | synced daily aggregate rows |

## Policy

- Do not introduce a breaking payload change without a new documented contract version.
- Keep old stored payloads readable when practical.
- Backend schemas should reject unknown request fields.
- Backend persistence endpoints must stay textless unless a separate privacy design says otherwise.
- If a route gains a new optional response field, document it but do not bump the contract version unless clients must change behavior.
- If a route changes required fields, semantics, value bounds, or privacy behavior, bump the relevant contract version.

## Signal Contract

Current signal writes use:

- `schema_version: "signal.v4"`
- `prompt_version: "extraction.v5"`

The server accepts client signal payloads only after strict validation and sanitization. The deterministic mapper may recompute derived metrics such as `load`, `fatigue`, `focus`, confidence, and quality.

Signal v4 adds deterministic context fields: `entry_intent`, `structure_signal`, and `temporal_context`. These fields are derived from the current entry text shape and entry metadata, not from history, RAG, hidden memory, or model guesses.

Signal v2/v3 rows can remain readable as historical data, but new extraction/reprocess work targets Signal v4.

## Self-Report Contract

Raw self-report events are browser-local. Backend sync accepts daily numeric aggregates only.

Current aggregate rows must include:

- `schema_version: "self_report.v1"`
- `aggregate_version: "self_report_daily_aggregate.v1"`

The backend replaces a whole local day during aggregate sync. This makes retries idempotent and avoids partial daily state.

## Route Prefix Decision

Athena does not currently use `/api/v1`.

Reasons:

- the app is still a single client/server product;
- route prefix migration would touch many client calls without adding immediate contract safety;
- payload-level versions already match the highest-risk contracts: signals and aggregates.

Revisit route prefixing only if Athena needs third-party clients, long-lived public integrations, or parallel route implementations.
