CREATE TABLE IF NOT EXISTS insight_snapshots (
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
  UNIQUE(layer, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_layer_period
ON insight_snapshots(layer, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_expires
ON insight_snapshots(layer, expires_at);
