import type {
  SelfReportAxis,
  SelfReportDailyAggregate,
} from "../core/types.js";
import type { AthenaDb } from "../db/sqlite.js";

type SelfReportDailyAggregateRow = SelfReportDailyAggregate & {
  id: number;
};

export async function replaceSelfReportDailyAggregates(
  db: AthenaDb,
  localDay: string,
  aggregates: SelfReportDailyAggregate[],
) {
  await db.run("DELETE FROM self_report_daily_aggregates WHERE local_day = ?", [
    localDay,
  ]);

  for (const aggregate of aggregates) {
    await db.run(
      `
      INSERT INTO self_report_daily_aggregates (
        local_day,
        axis,
        count,
        sum,
        sum_squares,
        mean,
        min,
        max,
        schema_version,
        aggregate_version,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        aggregate.local_day,
        aggregate.axis,
        aggregate.count,
        aggregate.sum,
        aggregate.sum_squares,
        aggregate.mean,
        aggregate.min,
        aggregate.max,
        aggregate.schema_version,
        aggregate.aggregate_version,
        aggregate.updated_at,
      ],
    );
  }
}

export async function listSelfReportDailyAggregates(
  db: AthenaDb,
  localDay: string,
) {
  return db.all<SelfReportDailyAggregateRow[]>(
    `
    SELECT
      id,
      local_day,
      axis,
      count,
      sum,
      sum_squares,
      mean,
      min,
      max,
      schema_version,
      aggregate_version,
      updated_at
    FROM self_report_daily_aggregates
    WHERE local_day = ?
    ORDER BY axis ASC
    `,
    [localDay],
  );
}

export async function getSelfReportDailyAggregate(
  db: AthenaDb,
  localDay: string,
  axis: SelfReportAxis,
) {
  return db.get<SelfReportDailyAggregateRow>(
    `
    SELECT
      id,
      local_day,
      axis,
      count,
      sum,
      sum_squares,
      mean,
      min,
      max,
      schema_version,
      aggregate_version,
      updated_at
    FROM self_report_daily_aggregates
    WHERE local_day = ? AND axis = ?
    `,
    [localDay, axis],
  );
}
