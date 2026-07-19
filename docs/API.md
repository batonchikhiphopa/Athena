# API Reference

Athena keeps API routes unversioned for now. Contract versions are documented in payload fields instead of a `/api/v1` route prefix.

All backend payloads are JSON. Request bodies are validated with strict Zod schemas: unknown fields are rejected. The backend currently has no authentication; keep it on a trusted local interface.

Raw diary text is not accepted by entry persistence endpoints. The only endpoint that accepts raw text is `POST /extractions`, where text is transient input for the selected extraction provider.

## Contract Versions

Current documented contract versions:

- Signal schema: `signal.v5`
- Extraction prompt: `extraction.v7`
- Self-report event schema: `self_report.v1`
- Self-report daily aggregate schema: `self_report_daily_aggregate.v1`
- Insight generation: `insight.v3`
- Browser-local activity insight fingerprint: `activity-insight.v2`

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
- `404` entry or insight not found
- `409` source hash mismatch
- `413` JSON body too large
- `429` activity-insight daily limit or provider quota
- `502` provider rejected, unavailable, or returned an invalid response
- `503` configured provider key missing
- `504` provider timeout
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
    "schema_version": "signal.v5",
    "prompt_version": "extraction.v7"
  }
}
```

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
    "activity_contexts": [],
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
    "schema_version": "signal.v5",
    "prompt_version": "extraction.v7",
    "provider": "ollama",
    "model": "gpt-oss:20b",
    "error_code": null,
    "created_at": "2026-06-06T12:00:00.000Z"
  }
}
```

`source_text_hash` is the SHA-256 hash of the local raw entry text. The raw text itself is not sent.

Current Signal context fields are textless deterministic metadata.
`entry_intent` and `structure_signal` are derived from the current entry text
shape; `temporal_context` is derived from entry metadata such as `entry_date`
or `captured_at`.

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
    "schema_version": "signal.v5",
    "prompt_version": "extraction.v7",
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
    "schema_version": "signal.v5",
    "prompt_version": "extraction.v7",
    "provider": "ollama",
    "model": "gpt-oss:20b",
    "error_code": null,
    "created_at": "2026-06-06T12:00:00.000Z"
  }
}
```

## Results Activity Insights

### `POST /results/activity-insights`

Creates one textless, bounded Results insight batch after the user explicitly
selects `Formulate review` in an expanded Results item. Deterministic day/week facts inside
Results do not use this endpoint. The request accepts one to eight unique
activities.

Request:

```json
{
  "model": "gemini-3.1-flash-lite",
  "language": "ru",
  "activities": [
    {
      "id": "athena",
      "label": "Athena",
      "kind": "task",
      "stage": "active",
      "rhythm": "steady",
      "burnoutRelation": "mixed",
      "recentEvents": ["result", "mention"],
      "recentContexts": [
        {
          "kind": "task",
          "event": "progressed",
          "outcome": "partial",
          "blockers": [],
          "strategy": "adjusted",
          "next_step": "explicit",
          "agency": "active",
          "effect": "neutral",
          "confidence": "high"
        }
      ],
      "evidenceCount": 4,
      "observationCount": 3,
      "spanDays": 6
    }
  ]
}
```

Response:

```json
{
  "insights": [
    {
      "activityId": "athena",
      "text": "Validated Athena prose without numeric claims.",
      "status": "ready",
      "confidence": "medium",
      "sources": [
        {
          "title": "Public source title",
          "url": "https://example.org/source"
        }
      ]
    }
  ]
}
```

Activities with fewer than two independent observations return a local
`insufficient` response without a provider call. For eligible activities, the
server removes `label`, replaces `id` with a temporary token, sends only the
remaining structured aggregate to Gemini, validates a one-to-one response, and
maps the token back. Ready prose covers the situation, a desirable action, and
an optional general recommendation grounded through Google Search. Grounding
source titles and HTTP(S) URLs are sanitized and returned with the prose.
Requests, generated prose, and links are not persisted by the backend. The
server-side daily quota is held in process memory per source IP.

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

Stored snapshot text is returned as written and is not reformatted.

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
    "schema_version": "signal.v5",
    "prompt_version": "extraction.v7",
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

The response must not include raw diary text, raw self-report events, credentials, or provider secrets.

## Analytics

### `GET /analytics/v2/summary`

Returns deterministic Analytics V2 week and month summaries.

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
          "schema_versions": ["signal.v5"],
          "prompt_versions": ["extraction.v7"],
          "models": ["gpt-oss:20b"],
          "self_report_aggregate_versions": ["self_report_daily_aggregate.v1"]
        },
        "baseline": {
          "schema_versions": ["signal.v5"],
          "prompt_versions": ["extraction.v7"],
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
