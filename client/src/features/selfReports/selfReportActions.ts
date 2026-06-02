import { enqueueSelfReportAggregateSync } from "./selfReportQueue";
import {
  deleteEntrySelfReport,
  saveEntrySelfReport,
} from "./selfReportStorage";
import type { SelfReportValues } from "./selfReportTypes";

export async function saveEntrySelfReportAndSync(input: {
  entryId: string;
  localDay: string;
  values: SelfReportValues;
}) {
  const report = await saveEntrySelfReport(input);
  await enqueueSelfReportAggregateSync(input.localDay).catch((error) => {
    console.warn("[self-report:enqueue-aggregate-sync]", error);
  });

  return report;
}

export async function deleteEntrySelfReportAndSync(entryId: string) {
  const deleted = await deleteEntrySelfReport(entryId);
  if (!deleted) return null;

  await enqueueSelfReportAggregateSync(deleted.local_day).catch((error) => {
    console.warn("[self-report:enqueue-delete-aggregate-sync]", error);
  });

  return deleted;
}
