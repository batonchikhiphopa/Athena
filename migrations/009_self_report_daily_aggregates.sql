CREATE TABLE IF NOT EXISTS self_report_daily_aggregates (
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

CREATE INDEX IF NOT EXISTS idx_self_report_daily_aggregates_day
ON self_report_daily_aggregates(local_day);

CREATE INDEX IF NOT EXISTS idx_self_report_daily_aggregates_axis
ON self_report_daily_aggregates(axis);

CREATE INDEX IF NOT EXISTS idx_self_report_daily_aggregates_updated
ON self_report_daily_aggregates(updated_at);
