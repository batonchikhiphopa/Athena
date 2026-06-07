# API Reference

Athena keeps API routes unversioned for now. Contract versions are documented in payload fields instead of a `/api/v1` route prefix.

All backend payloads are JSON. Request bodies are validated with strict Zod schemas: unknown fields are rejected. Mutating requests require server auth and CSRF only when `ATHENA_AUTH_REQUIRED=true`.

Raw diary text is not accepted by entry persistence endpoints. The only endpoint that accepts raw text is `POST /extractions`, where text is transient input for the selected extraction provider.

## Contract Versions

Current documented contract versions:

- Signal schema: `signal.v4`
- Extraction prompt: `extraction.v5`
- Self-report event schema: `self_report.v1`
- Self-report daily aggregate schema: `self_report_daily_aggregate.v1`

See [Contracts](CONTRACTS.md) for the versioning policy.

## Common Errors

Validation errors return:

```json
{
  "error": "Message",
  "details": {
    "formErrors": [],
    "fieldErrors": {}
  }
}
```

Common statuses:

- `400` invalid payload or local-day mismatch
- `401` unauthenticated when server auth is required
- `403` disabled auth endpoint or missing/invalid CSRF
- `404` entry or insight not found
- `409` owner already configured or source hash mismatch
- `413` JSON body too large
- `500` unexpected server error

## Config

### `GET /config`

Returns active local configuration visible to the client.

Response:

```json
{
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "model": "gpt-oss:20b",
    "requestTimeoutMs": 30000
  },
  "versions": {
    "schema_version": "signal.v4",
    "prompt_version": "extraction.v5"
  }
}
```

## Auth

Auth routes are always available, but setup/login/logout are meaningful only when `ATHENA_AUTH_REQUIRED=true`.

### `GET /auth/me`

Returns auth mode and current session state.

Response when auth is disabled:

```json
{
  "auth_required": false,
  "authenticated": true,
  "setup_required": false,
  "user": null
}
```

Response when authenticated:

```json
{
  "auth_required": true,
  "authenticated": true,
  "setup_required": false,
  "user": {
    "id": 1,
    "username": "owner",
    "role": "owner"
  },
  "csrf_token": "token"
}
```

### `POST /auth/setup`

Creates the first owner account.

Request:

```json
{
  "username": "owner",
  "password": "minimum-8-chars"
}
```

Response `201`:

```json
{
  "user": {
    "id": 1,
    "username": "owner",
    "role": "owner"
  },
  "csrf_token": "token"
}
```

### `POST /auth/login`

Request:

```json
{
  "username": "owner",
  "password": "minimum-8-chars"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "username": "owner",
    "role": "owner"
  },
  "csrf_token": "token"
}
```

### `POST /auth/logout`

Requires auth and CSRF when server auth is enabled.

Response: `204 No Content`

## Entries

Entries endpoints persist textless metadata and sanitized/effective signal data. They never accept raw diary text.

### Entry Payload Shape

Create request:

```json
{
  "client_entry_id": "local-id",
  "entry_date": "2026-06-06",
  "tags": ["work", "health"],
  "source_text_hash": "64 lowercase hex chars",
  "signal": {
    "topics": [],
    "activities": [],
    "markers": [],
    "load": null,
    "fatigue": null,
    "focus": null,
    "signal_quality": "sparse",
    "entry_intent": {
      "intent": "unknown",
      "confidence": "low",
      "basis": []
    },
    "structure_signal": {
      "density": "empty",
      "coherence": "low",
      "has_question": false,
      "has_plan": false,
      "basis": []
    },
    "temporal_context": {
      "local_date": null,
      "time_bucket": "unknown",
      "source": "absent"
    }
  },
  "metadata": {
    "schema_version": "signal.v4",
    "prompt_version": "extraction.v5",
    "provider": "ollama",
    "model": "gpt-oss:20b",
    "error_code": null,
    "created_at": "2026-06-06T12:00:00.000Z"
  }
}
```

`source_text_hash` is the SHA-256 hash of the local raw entry text. The raw text itself is not sent.

Signal v4 context fields are textless deterministic metadata. `entry_intent` and `structure_signal` are derived from the current entry text shape; `temporal_context` is derived from entry metadata such as `entry_date` or `captured_at`.

### `GET /entries`

Response:

```json
{
  "entries": []
}
```

### `GET /entries/:id`

Response:

```json
{
  "entry": {
    "id": 1,
    "client_entry_id": "local-id",
    "entry_date": "2026-06-06",
    "tags": ["work"],
    "status": "extracted",
    "source_text_hash": "64 lowercase hex chars",
    "signal": {},
    "metadata": {},
    "created_at": "2026-06-06T12:00:00.000Z",
    "updated_at": "2026-06-06T12:00:00.000Z"
  }
}
```

### `POST /entries`

Creates or idempotently returns an existing server entry when `client_entry_id` and `source_text_hash` match.

Response `201`:

```json
{
  "entry": {}
}
```

Conflict:

- `409` when `client_entry_id` exists with a different `source_text_hash`

### `PATCH /entries/:id`

Updates textless metadata and signal for an existing entry.

Request shape is the create request without `client_entry_id`.

Response:

```json
{
  "entry": {}
}
```

### `DELETE /entries/:id`

Deletes entry metadata and associated signals.

Response: `204 No Content`

### `POST /entries/:id/signals`

Appends a new signal for an existing entry and source hash.

Request:

```json
{
  "source_text_hash": "64 lowercase hex chars",
  "signal": {},
  "metadata": {
    "schema_version": "signal.v4",
    "prompt_version": "extraction.v5",
    "provider": "ollama",
    "model": "gpt-oss:20b"
  }
}
```

Response:

```json
{
  "entry": {}
}
```

## Extractions

Extraction endpoints are the only API surface that can receive raw entry text, and only for the current entry analysis request.

### `GET /extractions/config`

Returns provider options and defaults.

Response:

```json
{
  "defaultProvider": "ollama",
  "providers": [
    {
      "id": "ollama",
      "label": "Ollama local (privacy first)",
      "defaultModel": "gpt-oss:20b",
      "models": ["gpt-oss:20b"],
      "configured": true
    }
  ]
}
```

### `GET /extractions/status?provider=ollama&model=gpt-oss:20b`

Checks whether a provider/model is available.

Response:

```json
{
  "provider": "ollama",
  "model": "gpt-oss:20b",
  "available": true,
  "message": "ok"
}
```

### `POST /extractions`

Request:

```json
{
  "text": "current entry text",
  "provider": "ollama",
  "model": "gpt-oss:20b",
  "entry_date": "2026-06-06",
  "captured_at": "2026-06-06T12:00:00.000Z"
}
```

Response is a sanitized signal payload plus metadata:

```json
{
  "signal": {},
  "metadata": {
    "schema_version": "signal.v4",
    "prompt_version": "extraction.v5",
    "provider": "ollama",
    "model": "gpt-oss:20b",
    "error_code": null,
    "created_at": "2026-06-06T12:00:00.000Z"
  }
}
```

## Insights

Insights are text snapshots derived from deterministic analytics and sufficiency rules.

### `GET /insights/current?today=YYYY-MM-DD`

Returns current eligible day/week/month insight snapshots.

Response:

```json
{
  "insights": []
}
```

### `GET /insights`

Returns insight snapshot history.

Response:

```json
{
  "insights": []
}
```

### `DELETE /insights/:id`

Soft-deletes an insight snapshot.

Response: `204 No Content`

## Self-Report Daily Aggregates

Self-report endpoints sync daily numeric aggregates only. Raw self-report events stay local.

Current aggregate contract:

- `schema_version`: `self_report.v1`
- `aggregate_version`: `self_report_daily_aggregate.v1`
- axes: `mood`, `stress`, `energy`, `sleep_quality`, `function`
- values are bounded to `0..10`

### `PUT /self-reports/daily-aggregates/:localDay`

Replaces all synced aggregate rows for a local day.

Request:

```json
{
  "aggregates": [
    {
      "local_day": "2026-06-06",
      "axis": "mood",
      "count": 2,
      "sum": 14,
      "sum_squares": 100,
      "mean": 7,
      "min": 6,
      "max": 8,
      "schema_version": "self_report.v1",
      "aggregate_version": "self_report_daily_aggregate.v1",
      "updated_at": "2026-06-06T12:00:00.000Z"
    }
  ]
}
```

Response:

```json
{
  "aggregates": []
}
```

`400` is returned when any aggregate `local_day` differs from the route `:localDay`.

### `GET /self-reports/daily-aggregates/:localDay`

Response:

```json
{
  "aggregates": []
}
```

## Backend Metadata Export

### `GET /exports/backend-metadata`

Returns a versioned textless backend metadata export. This is not a full diary export because raw diary text stays in browser-local storage.

Response:

```json
{
  "app": "athena",
  "export_version": "backend_metadata_export.v1",
  "exported_at": "2026-06-06T12:00:00.000Z",
  "source": {
    "app_version": null,
    "schema_version": "signal.v4",
    "prompt_version": "extraction.v5",
    "self_report_schema_version": "self_report.v1",
    "self_report_daily_aggregate_version": "self_report_daily_aggregate.v1",
    "backend_schema_version": "011"
  },
  "entries": [],
  "signals": [],
  "effective_signals": [],
  "signal_overrides": [],
  "self_report_daily_aggregates": [],
  "insight_snapshots": []
}
```

The response must not include raw diary text, raw self-report events, auth session data, password hashes, CSRF tokens, or provider secrets.

## Analytics

### `GET /analytics/summary`

Returns deterministic week and month summaries based on latest available backend entry dates.

Response when no entries exist:

```json
{
  "week": null,
  "month": null
}
```

Response with data:

```json
{
  "week": {
    "window": "week",
    "from": "2026-05-31",
    "to": "2026-06-06",
    "metrics": {},
    "versions": {
      "schema_versions": ["signal.v4"],
      "prompt_versions": ["extraction.v5"]
    }
  },
  "month": {}
}
```
