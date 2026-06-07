import { enqueueQueueJob } from "../sync/queue";
import type { QueueJob } from "../sync/queueTypes";
import { syncSelfReportDailyAggregates } from "./selfReportApi";
import { getSelfReportDailyAggregates } from "./selfReportStorage";

export type SelfReportDailyAggregateQueuePayload = {
  local_day: string;
  queued_at: string;
};

export async function enqueueSelfReportAggregateSync(localDay: string) {
  return enqueueQueueJob<SelfReportDailyAggregateQueuePayload>({
    type: "self_report.sync_daily_aggregate",
    payload: {
      local_day: localDay,
      queued_at: new Date().toISOString(),
    },
    priority: 1,
    max_attempts: 3,
    entity_kind: "self_report_daily_aggregate",
    entity_id: localDay,
  });
}

export async function handleSelfReportAggregateSyncJob(
  job: QueueJob<SelfReportDailyAggregateQueuePayload>,
  signal: AbortSignal,
) {
  if (signal.aborted) throw new Error("Job was cancelled.");

  const localDay = job.payload.local_day || job.entity_id;
  if (!localDay) {
    throw new Error("validation: self_report.sync_daily_aggregate missing local_day");
  }

  const aggregates = await getSelfReportDailyAggregates(localDay);

  if (signal.aborted) throw new Error("Job was cancelled.");

  await syncSelfReportDailyAggregates(localDay, aggregates);
}
