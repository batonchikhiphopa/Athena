CREATE TABLE athena_schema (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  fingerprint TEXT NOT NULL CHECK (length(fingerprint) = 64),
  initialized_at TEXT NOT NULL
);

CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_entry_id TEXT NOT NULL UNIQUE,
  entry_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('extracted', 'fallback', 'failed')),
  tags TEXT DEFAULT '[]',
  source_text_hash TEXT NOT NULL
);

CREATE TABLE signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  source_text_hash TEXT NOT NULL,
  topics TEXT NOT NULL,
  activities TEXT NOT NULL,
  activity_contexts TEXT NOT NULL DEFAULT '[]',
  markers TEXT NOT NULL,
  state_inference TEXT NOT NULL DEFAULT '{}',
  metric_confidence TEXT NOT NULL DEFAULT '{"load":"low","fatigue":"low","focus":"low"}',
  entry_intent TEXT NOT NULL DEFAULT '{"intent":"unknown","confidence":"low","basis":[]}',
  structure_signal TEXT NOT NULL DEFAULT '{"density":"empty","coherence":"low","has_question":false,"has_plan":false,"basis":[]}',
  temporal_context TEXT NOT NULL DEFAULT '{"local_date":null,"time_bucket":"unknown","source":"absent"}',
  quality_reason TEXT NOT NULL DEFAULT 'legacy_signal_v2',
  load REAL,
  fatigue REAL,
  focus REAL,
  signal_quality TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'ollama',
  model TEXT NOT NULL,
  error_code TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES entries(id)
);

CREATE TABLE signal_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  load REAL,
  fatigue REAL,
  focus REAL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (entry_id) REFERENCES entries(id)
);

CREATE TABLE insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  text TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE insight_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  layer TEXT NOT NULL
    CHECK (layer IN ('day', 'week', 'month')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  text TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  deleted_at TEXT,
  topic TEXT,
  UNIQUE(layer, period_start, period_end)
);

CREATE TABLE self_report_daily_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_day TEXT NOT NULL,
  axis TEXT NOT NULL
    CHECK (axis IN (
      'mood',
      'stress',
      'energy',
      'sleep_quality',
      'function'
    )),
  count INTEGER NOT NULL CHECK (count > 0),
  sum REAL NOT NULL,
  sum_squares REAL NOT NULL,
  mean REAL NOT NULL CHECK (mean >= 0 AND mean <= 10),
  min REAL NOT NULL CHECK (min >= 0 AND min <= 10),
  max REAL NOT NULL CHECK (max >= 0 AND max <= 10),
  schema_version TEXT NOT NULL,
  aggregate_version TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (local_day, axis)
);

CREATE INDEX idx_entries_entry_date
ON entries(entry_date);

CREATE INDEX idx_entries_status
ON entries(status);

CREATE INDEX idx_entries_client_entry_id
ON entries(client_entry_id);

CREATE INDEX idx_entries_source_text_hash
ON entries(source_text_hash);

CREATE INDEX idx_entries_sort_desc
ON entries(entry_date DESC, created_at DESC, id DESC);

CREATE INDEX idx_signals_entry_id
ON signals(entry_id);

CREATE INDEX idx_signals_quality
ON signals(signal_quality);

CREATE INDEX idx_signals_versions
ON signals(schema_version, prompt_version, provider, model);

CREATE INDEX idx_signals_entry_hash
ON signals(entry_id, source_text_hash);

CREATE INDEX idx_signals_entry_created_desc
ON signals(entry_id, created_at DESC, id DESC);

CREATE INDEX idx_signal_overrides_entry_created_desc
ON signal_overrides(entry_id, created_at DESC, id DESC);

CREATE INDEX idx_insight_snapshots_layer_period
ON insight_snapshots(layer, period_start, period_end);

CREATE INDEX idx_insight_snapshots_expires
ON insight_snapshots(layer, expires_at);

CREATE INDEX idx_insight_snapshots_deleted
ON insight_snapshots(deleted_at);

CREATE INDEX idx_insight_snapshots_visible_latest
ON insight_snapshots(layer, period_end DESC, generated_at DESC, id DESC)
WHERE deleted_at IS NULL;

CREATE INDEX idx_self_report_daily_aggregates_day
ON self_report_daily_aggregates(local_day);

CREATE INDEX idx_self_report_daily_aggregates_axis
ON self_report_daily_aggregates(axis);

CREATE INDEX idx_self_report_daily_aggregates_updated
ON self_report_daily_aggregates(updated_at);

CREATE VIEW effective_signals AS
WITH latest_signals AS (
  SELECT s.*
  FROM signals s
  WHERE s.id = (
    SELECT latest.id
    FROM signals latest
    WHERE latest.entry_id = s.entry_id
    ORDER BY latest.created_at DESC, latest.id DESC
    LIMIT 1
  )
),
latest_overrides AS (
  SELECT o.*
  FROM signal_overrides o
  WHERE o.id = (
    SELECT latest.id
    FROM signal_overrides latest
    WHERE latest.entry_id = o.entry_id
    ORDER BY latest.created_at DESC, latest.id DESC
    LIMIT 1
  )
)
SELECT
  s.id AS signal_id,
  s.entry_id,
  s.source_text_hash,
  s.topics,
  s.activities,
  s.activity_contexts,
  s.markers,
  s.state_inference,
  s.metric_confidence,
  s.entry_intent,
  s.structure_signal,
  s.temporal_context,
  s.quality_reason,
  COALESCE(o.load, s.load) AS load,
  COALESCE(o.fatigue, s.fatigue) AS fatigue,
  COALESCE(o.focus, s.focus) AS focus,
  s.signal_quality,
  s.schema_version,
  s.prompt_version,
  s.provider,
  s.model,
  s.error_code,
  s.created_at AS signal_created_at,
  o.id AS override_id,
  o.created_at AS override_created_at
FROM latest_signals s
LEFT JOIN latest_overrides o
  ON o.entry_id = s.entry_id;
