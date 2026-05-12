CREATE INDEX IF NOT EXISTS idx_signals_entry_created_desc
ON signals(entry_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_signal_overrides_entry_created_desc
ON signal_overrides(entry_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_entries_sort_desc
ON entries(entry_date DESC, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_insight_snapshots_visible_latest
ON insight_snapshots(layer, period_end DESC, generated_at DESC, id DESC)
WHERE deleted_at IS NULL;
