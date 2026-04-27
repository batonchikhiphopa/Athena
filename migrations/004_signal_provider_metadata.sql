DROP VIEW IF EXISTS effective_signals;

ALTER TABLE signals ADD COLUMN provider TEXT NOT NULL DEFAULT 'ollama';
ALTER TABLE signals ADD COLUMN error_code TEXT;

DROP INDEX IF EXISTS idx_signals_versions;
CREATE INDEX IF NOT EXISTS idx_signals_versions
ON signals(schema_version, prompt_version, provider, model);

DROP INDEX IF EXISTS idx_signals_entry_hash;
CREATE INDEX IF NOT EXISTS idx_signals_entry_hash
ON signals(entry_id, source_text_hash);

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
  s.markers,

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
