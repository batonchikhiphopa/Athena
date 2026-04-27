ALTER TABLE insight_snapshots
ADD COLUMN deleted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_deleted
ON insight_snapshots(deleted_at);
