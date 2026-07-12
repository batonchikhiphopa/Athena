import type { SelfReportDailyAggregate } from "../../core/types.js";
import type { AthenaDb } from "../../db/sqlite.js";
import { withDbWriteTransaction } from "../../db/sqlite.js";
import {
  listSelfReportDailyAggregates,
  replaceSelfReportDailyAggregates,
} from "./selfReport.repository.js";

export async function syncSelfReportDailyAggregates(
  db: AthenaDb,
  localDay: string,
  aggregates: SelfReportDailyAggregate[],
) {
  const invalidDay = aggregates.find(
    (aggregate) => aggregate.local_day !== localDay,
  );

  if (invalidDay) {
    throw new Error("self_report_aggregate_day_mismatch");
  }

  await withDbWriteTransaction(db, (transactionDb) =>
    replaceSelfReportDailyAggregates(transactionDb, localDay, aggregates),
  );

  return listSelfReportDailyAggregates(db, localDay);
}

export async function listSyncedSelfReportDailyAggregates(
  db: AthenaDb,
  localDay: string,
) {
  return listSelfReportDailyAggregates(db, localDay);
}
