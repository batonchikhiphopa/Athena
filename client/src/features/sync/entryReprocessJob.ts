import { enqueueQueueJob } from "../../lib/queue";
import type { EntryReprocessReason } from "../../lib/queueTypes";
import {
  createEntryReprocessJobIdempotencyKey,
  createEntryReprocessPayload,
} from "./reprocessPolicy";

export async function enqueueEntrySignalReprocessJob({
  entryId,
  serverId,
  sourceTextHash,
  reason,
  priority = 10,
}: {
  entryId: string;
  serverId?: number | null;
  sourceTextHash: string;
  reason: EntryReprocessReason;
  priority?: number;
}) {
  return enqueueQueueJob({
    type: "entry.reprocess_signal",
    payload: createEntryReprocessPayload({
      entryId,
      serverId,
      sourceTextHash,
      reason,
    }),
    priority,
    entity_kind: "entry",
    entity_id: entryId,
    idempotency_key: createEntryReprocessJobIdempotencyKey({
      entryId,
      sourceTextHash,
      reason,
    }),
  });
}
