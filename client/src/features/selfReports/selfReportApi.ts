import {
  jsonHeaders,
} from "../../shared/http/httpClient";
import type { SelfReportDailyAggregate } from "./selfReportTypes";

export type SyncSelfReportDailyAggregatePayload = Omit<
  SelfReportDailyAggregate,
  "id"
>;

export async function syncSelfReportDailyAggregates(
  localDay: string,
  aggregates: SelfReportDailyAggregate[],
) {
  const response = await fetch(
    `/self-reports/daily-aggregates/${encodeURIComponent(localDay)}`,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: jsonHeaders(),
      body: JSON.stringify({
        aggregates: serializeSelfReportDailyAggregates(aggregates),
      }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Не удалось синхронизировать self-report aggregates: ${await response.text()}`,
    );
  }
}

export function serializeSelfReportDailyAggregates(
  aggregates: SelfReportDailyAggregate[],
): SyncSelfReportDailyAggregatePayload[] {
  return aggregates.map((aggregate) => ({
    local_day: aggregate.local_day,
    axis: aggregate.axis,
    count: aggregate.count,
    sum: aggregate.sum,
    sum_squares: aggregate.sum_squares,
    mean: aggregate.mean,
    min: aggregate.min,
    max: aggregate.max,
    schema_version: aggregate.schema_version,
    aggregate_version: aggregate.aggregate_version,
    updated_at: aggregate.updated_at,
  }));
}
