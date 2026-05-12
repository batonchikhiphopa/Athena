import type { AthenaDb } from "../db/sqlite.js";

type DateRange = {
  from: string;
  to: string;
};

export type EntryWithSignalRangeRow = {
  entry_id: number;
  entry_date: string;
  status: string;
  topics: string | null;
  activities: string | null;
  markers: string | null;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  signal_quality: string | null;
  schema_version: string | null;
  prompt_version: string | null;
  model: string | null;
  override_id: number | null;
};

export async function getEntriesWithSignalsInRange(
  db: AthenaDb,
  { from, to }: DateRange,
): Promise<EntryWithSignalRangeRow[]> {
  const rows = await db.all<EntryWithSignalRangeRow[]>(
    `
    SELECT
      e.id AS entry_id,
      e.entry_date,
      e.status,
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
      o.id AS override_id
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
  `,
    [from, to],
  );

  return rows;
}
