import {
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../../config/versions.js";
import type { AthenaDb } from "../../db/sqlite.js";

export async function buildBackendMetadataExport(db: AthenaDb) {
  const [
    entries,
    signals,
    effectiveSignals,
    signalOverrides,
    selfReportDailyAggregates,
    insightSnapshots,
    latestMigration,
  ] = await Promise.all([
    db.all("SELECT * FROM entries ORDER BY id"),
    db.all("SELECT * FROM signals ORDER BY id"),
    db.all("SELECT * FROM effective_signals ORDER BY entry_id"),
    db.all("SELECT * FROM signal_overrides ORDER BY id"),
    db.all("SELECT * FROM self_report_daily_aggregates ORDER BY local_day, axis"),
    db.all("SELECT * FROM insight_snapshots ORDER BY generated_at, id"),
    db.get<{ id: string }>(
      "SELECT id FROM schema_migrations ORDER BY id DESC LIMIT 1",
    ),
  ]);

  return {
    app: "athena",
    export_version: "backend_metadata_export.v1",
    exported_at: new Date().toISOString(),
    source: {
      app_version: null,
      schema_version: ACTIVE_SCHEMA_VERSION,
      prompt_version: ACTIVE_PROMPT_VERSION,
      self_report_schema_version: "self_report.v1",
      self_report_daily_aggregate_version: "self_report_daily_aggregate.v1",
      backend_schema_version: latestMigration?.id ?? null,
    },
    entries,
    signals,
    effective_signals: effectiveSignals,
    signal_overrides: signalOverrides,
    self_report_daily_aggregates: selfReportDailyAggregates,
    insight_snapshots: insightSnapshots,
  };
}
