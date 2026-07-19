# Contracts And Versioning

Athena uses documented contract versions instead of a route prefix such as `/api/v1`.

This keeps the current API stable for the client while making payload evolution explicit. Route names describe resources; payload fields describe contract versions.

## Current Versions

| Contract | Current version | Where it appears |
| --- | --- | --- |
| Signal schema | `signal.v5` | signal metadata, config response, analytics version summaries |
| Extraction prompt | `extraction.v7` | signal metadata, config response, analytics version summaries |
| Self-report event schema | `self_report.v1` | local aggregate inputs |
| Self-report daily aggregate | `self_report_daily_aggregate.v1` | synced daily aggregate rows |
| Insight generation | `insight.v3` | generated insight snapshot text |
| Activity insight fingerprint | `activity-insight.v2` | encrypted browser-local Results cache invalidation |

## Policy

- Do not introduce a breaking payload change without a new documented contract version.
- Accept only the active dev contract at runtime and in local imports.
- Backend schemas should reject unknown request fields.
- Backend persistence endpoints must stay textless unless a separate privacy design says otherwise.
- If a route gains a new optional response field, document it but do not bump the contract version unless clients must change behavior.
- If a route changes required fields, semantics, value bounds, or privacy behavior, bump the relevant contract version.

## Signal Contract

Current signal writes use:

- `schema_version: "signal.v5"`
- `prompt_version: "extraction.v7"`

The server accepts client signal payloads only after strict validation and sanitization. The deterministic mapper may recompute derived metrics such as `load`, `fatigue`, `focus`, confidence, and quality.

The current signal includes deterministic `entry_intent`, `structure_signal`,
and `temporal_context` fields derived from the current entry text shape and
entry metadata, not from history, RAG, hidden memory, or model guesses.

Signal v5 adds `activity_contexts`: bounded enum-only evidence attributed to a specific extracted activity. It records the supported kind, event, outcome, blockers, strategy, next-step clarity, agency, felt effect, and confidence without quotes or free-text summaries.

The runtime enum vocabulary and active Signal/prompt versions are defined once
in `shared/contracts`. Client normalization, server Zod validation, and provider
JSON schemas consume those values directly.

## Activity Insight Contract

`POST /results/activity-insights` accepts at most eight activity aggregates.
Each input carries a local correlation id and label for request validation, but
the provider adapter removes both before network dispatch. Gemini receives only
temporary ids, bounded `activity_contexts`, recent event enums, kind, stage,
rhythm, burnout relation, and aggregate counts.

The server returns one strictly validated insight per activity id with:

- `status`: `ready` or `insufficient`;
- `confidence`: `low`, `medium`, or `high`;
- bounded prose with no numeric claims.

The client fingerprints the structured input, language, and model with
`activity-insight.v2`. Matching cached insights are reused; changed eligible
inputs may be sent in one daily Gemini batch only after the explicit
`Formulate review` action and are stored encrypted in the local vault. The
manual request uses the visible seven-day review window and neutralizes context
fields that are not shown in that review.

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
