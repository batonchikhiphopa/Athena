CREATE TABLE IF NOT EXISTS entries (
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

CREATE INDEX IF NOT EXISTS idx_entries_entry_date
ON entries(entry_date);

CREATE INDEX IF NOT EXISTS idx_entries_status
ON entries(status);

CREATE INDEX IF NOT EXISTS idx_entries_client_entry_id
ON entries(client_entry_id);

CREATE INDEX IF NOT EXISTS idx_entries_source_text_hash
ON entries(source_text_hash);

-- SIGNALS (immutable AI output)

CREATE TABLE IF NOT EXISTS signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,
  source_text_hash TEXT NOT NULL,

  topics TEXT NOT NULL,
  activities TEXT NOT NULL,
  markers TEXT NOT NULL,

  load REAL,
  fatigue REAL,
  focus REAL,

  signal_quality TEXT NOT NULL,

  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  model TEXT NOT NULL,

  created_at TEXT NOT NULL,

  FOREIGN KEY (entry_id) REFERENCES entries(id)
);

CREATE INDEX IF NOT EXISTS idx_signals_entry_id
ON signals(entry_id);

CREATE INDEX IF NOT EXISTS idx_signals_quality
ON signals(signal_quality);

-- USER OVERRIDES (append-only)

CREATE TABLE IF NOT EXISTS signal_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL,

  load REAL,
  fatigue REAL,
  focus REAL,

  created_at TEXT NOT NULL,

  FOREIGN KEY (entry_id) REFERENCES entries(id)
);

-- INSIGHTS (observations)

CREATE TABLE IF NOT EXISTS insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  period TEXT NOT NULL,
  text TEXT NOT NULL,

  schema_version TEXT NOT NULL,
  prompt_version TEXT NOT NULL,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_versions
ON signals(schema_version, prompt_version, model);

DROP INDEX IF EXISTS idx_signals_entry_hash;

CREATE UNIQUE INDEX IF NOT EXISTS idx_signals_entry_hash
ON signals(entry_id, source_text_hash);

-- EFFECTIVE SIGNALS VIEW
-- Read model: latest immutable signal + latest override

CREATE VIEW IF NOT EXISTS effective_signals AS
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
  s.markers,

  COALESCE(o.load, s.load) AS load,
  COALESCE(o.fatigue, s.fatigue) AS fatigue,
  COALESCE(o.focus, s.focus) AS focus,

  s.signal_quality,
  s.schema_version,
  s.prompt_version,
  s.model,
  s.created_at AS signal_created_at,

  o.id AS override_id,
  o.created_at AS override_created_at
FROM latest_signals s
LEFT JOIN latest_overrides o
  ON o.entry_id = s.entry_id;
