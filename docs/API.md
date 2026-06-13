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
- Insight generation: `insight.v3`

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

Insights are text snapshots derived from deterministic analytics and sufficiency
rules. New snapshots use Insight V3 input built from Analytics V2 summaries:
baseline/trend signals, density, uncertainty flags, textless context, optional
self-report agreement, and an explicit evidence-pack shape. Insight generation
reads only textless aggregates and effective signals; it does not read raw diary
text or raw self-report events.

Insight V3 rendered text separates:

- `Наблюдение` - the bounded observation;
- `Поддержка` - measured signal, context, and quality evidence;
- `Интерпретация` - a soft non-causal reading when evidence exists;
- `Ограничение` - uncertainty and non-causal framing;
- `Маленький шаг` - a tiny reversible next step.

Browser-local RAG evidence packs over raw diary chunks are not sent to these
backend endpoints.

Stored snapshot text remains backward-compatible: old snapshots are returned as
stored and are not reformatted.

Current sufficiency rules:

- `day`: yesterday has at least one valid signal day;
- `week`: at least three distinct valid signal days in the last 7 calendar days;
- `month`: at least fourteen distinct valid signal days in the last 30 calendar days.

Sparse, fallback, parse-error, and duplicate same-day entries do not increase
the valid-day count. Week and month snapshots may remain visible for their
retention windows after current sufficiency is lost.

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

Response excerpt with data:

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

### `GET /analytics/v2/summary`

Returns deterministic Analytics V2 week and month summaries. V2 is separate from
`/analytics/summary` so older observation code can remain compatible while the
new measurement layer grows.

Analytics V2 reads textless data only:

- `entries` metadata, dates, tags, status, and source hashes;
- latest `effective_signals`;
- synced `self_report_daily_aggregates`.

It does not read raw diary text or raw self-report events.

The current window is anchored to the latest `entries.entry_date`. Self-report
aggregates enrich an entry-based window, but they do not create standalone
analytics days. If an aggregate exists without a matching entry day, it is treated
as orphaned sync data and cannot make `week` or `month` non-empty by itself.

Response when no entries exist:

```json
{
  "week": {
    "reason": "no_data",
    "summary": null
  },
  "month": {
    "reason": "no_data",
    "summary": null
  }
}
```

Response with data:

```json
{
  "week": {
    "reason": null,
    "summary": {
      "version": "analytics.v2",
      "window": {
        "kind": "week",
        "start": "2026-04-29",
        "end": "2026-05-05",
        "days": 7
      },
      "baseline_window": {
        "kind": "baseline",
        "start": "2026-04-01",
        "end": "2026-04-28",
        "days": 28
      },
      "density": {
        "entry_days": 7,
        "valid_days": 7,
        "sparse_days": 0,
        "fallback_days": 0,
        "no_entry_days": 0,
        "entry_coverage": 1,
        "valid_density": 1,
        "fallback_density": 0,
        "missingness": 0
      },
      "axes": {
        "load": {
          "source": "extracted",
          "current_mean": 6.286,
          "current_sample_days": 7,
          "baseline_mean": 5,
          "baseline_sd": 0,
          "baseline_sample_days": 21,
          "baseline_quality": "strong",
          "delta_from_baseline": 1.286,
          "z_delta": 1.286,
          "direction": "up",
          "slope": 0.643,
          "trend_direction": "rising",
          "volatility": 1.604,
          "volatility_delta": 1.604,
          "volatility_direction": "more_variable",
          "sudden_delta": 3,
          "sudden_change": true,
          "uncertainty": []
        }
      },
      "context": {
        "topics": [],
        "activities": [],
        "markers": [],
        "tags": [],
        "recurrence": {
          "topics": [],
          "markers": [],
          "tags": []
        }
      },
      "quality": {
        "grade": "strong",
        "reason": "ok",
        "flags": []
      },
      "versions": {
        "current": {
          "schema_versions": ["signal.v4"],
          "prompt_versions": ["extraction.v5"],
          "models": ["gpt-oss:20b"],
          "self_report_aggregate_versions": ["self_report_daily_aggregate.v1"]
        },
        "baseline": {
          "schema_versions": ["signal.v4"],
          "prompt_versions": ["extraction.v5"],
          "models": ["gpt-oss:20b"],
          "self_report_aggregate_versions": ["self_report_daily_aggregate.v1"]
        },
        "version_boundary_blocks_comparison": false,
        "mixed_model": false
      },
      "associations": []
    }
  },
  "month": {
    "reason": null,
    "summary": {}
  }
}
```

Important V2 semantics:

- extracted axes are `load`, `fatigue`, and `focus`;
- self-report axes are `mood`, `stress`, `energy`, `sleep_quality`, and
  `function`;
- entry values are averaged per local day before window means are calculated;
- fallback signals do not contribute to state or context;
- sparse signals can contribute topics, markers, and activities, but not state;
- baseline is the 28 calendar days before the current window;
- schema or prompt boundaries between baseline and current windows block
  extracted baseline deltas and z-deltas;
- self-report axes remain separate from extracted axes and are never merged into
  an overall score;
- associations are correlation helpers only and include
  `association_not_causation` when computed.
