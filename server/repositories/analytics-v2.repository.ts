import type { AthenaDb } from "../db/sqlite.js";

type DateRange = {
  from: string;
  to: string;
};

type LatestAnalyticsDateRow = {
  date: string | null;
};

export type AnalyticsV2EntrySignalRow = {
  activities: string | null;
  entry_date: string;
  entry_id: number;
  fatigue: number | null;
  focus: number | null;
  load: number | null;
  markers: string | null;
  model: string | null;
  prompt_version: string | null;
  schema_version: string | null;
  signal_quality: string | null;
  status: string;
  tags: string | null;
  topics: string | null;
};

export type AnalyticsV2SelfReportAggregateRow = {
  aggregate_version: string;
  axis: string;
  count: number;
  local_day: string;
  mean: number;
  schema_version: string;
};

export type AnalyticsV2RangeRows = {
  entries: AnalyticsV2EntrySignalRow[];
  selfReports: AnalyticsV2SelfReportAggregateRow[];
};

export const ANALYTICS_V2_ENTRY_SIGNAL_ROWS_IN_RANGE_SQL = `
  SELECT
    e.id AS entry_id,
    e.entry_date,
    e.status,
    e.tags,
    s.topics,
    s.activities,
    s.markers,
    COALESCE(o.load, s.load) AS load,
    COALESCE(o.fatigue, s.fatigue) AS fatigue,
    COALESCE(o.focus, s.focus) AS focus,
    s.signal_quality,
    s.schema_version,
    s.prompt_version,
    s.model
  FROM entries e
  LEFT JOIN signals s
    ON s.id = (
      SELECT latest.id
      FROM signals latest
      WHERE latest.entry_id = e.id
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    )
  LEFT JOIN signal_overrides o
    ON o.id = (
      SELECT latest.id
      FROM signal_overrides latest
      WHERE latest.entry_id = e.id
      ORDER BY latest.created_at DESC, latest.id DESC
      LIMIT 1
    )
  WHERE e.entry_date BETWEEN ? AND ?
  ORDER BY e.entry_date ASC, e.created_at ASC, e.id ASC
`;

export async function getLatestAnalyticsV2Date(
  db: AthenaDb,
): Promise<string | null> {
  const row = await db.get<LatestAnalyticsDateRow>(`
    SELECT MAX(entry_date) AS date
    FROM entries
  `);

  return row?.date ?? null;
}

export async function getAnalyticsV2RowsInRange(
  db: AthenaDb,
  { from, to }: DateRange,
): Promise<AnalyticsV2RangeRows> {
  const [entries, selfReports] = await Promise.all([
    getEntrySignalRowsInRange(db, { from, to }),
    getSelfReportAggregateRowsInRange(db, { from, to }),
  ]);

  return { entries, selfReports };
}

async function getEntrySignalRowsInRange(
  db: AthenaDb,
  { from, to }: DateRange,
) {
  return db.all<AnalyticsV2EntrySignalRow[]>(
    ANALYTICS_V2_ENTRY_SIGNAL_ROWS_IN_RANGE_SQL,
    [from, to],
  );
}

async function getSelfReportAggregateRowsInRange(
  db: AthenaDb,
  { from, to }: DateRange,
) {
  return db.all<AnalyticsV2SelfReportAggregateRow[]>(
    `
    SELECT
      local_day,
      axis,
      count,
      mean,
      schema_version,
      aggregate_version
    FROM self_report_daily_aggregates
    WHERE local_day BETWEEN ? AND ?
    ORDER BY local_day ASC, axis ASC
    `,
    [from, to],
  );
}
