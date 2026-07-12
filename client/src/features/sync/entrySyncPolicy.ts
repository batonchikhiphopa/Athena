import type { EntrySyncQueuePayload } from "./queueTypes";

export type EntrySyncLocalEntrySnapshot = {
  id: string;
  source_text_hash: string;
  updatedAt: string;
  analysis_enabled: boolean;
};

export type EntrySyncConflictCode =
  | "source_hash_mismatch"
  | "stale_local_revision";

export type EntrySyncBlockCode = "missing_local_entry";

export type EntrySyncPlan =
  | {
      action: "sync";
    }
  | {
      action: "skip";
      reason: "analysis_disabled";
      message: string;
    }
  | {
      action: "block";
      code: EntrySyncBlockCode;
      message: string;
    }
  | {
      action: "conflict";
      code: EntrySyncConflictCode;
      message: string;
    };

export function planEntrySyncJob(
  payload: EntrySyncQueuePayload,
  localEntry: EntrySyncLocalEntrySnapshot | null,
): EntrySyncPlan {
  if (!localEntry) {
    return {
      action: "block",
      code: "missing_local_entry",
      message: `Local entry ${payload.entry_id} was not found.`,
    };
  }

  if (!localEntry.analysis_enabled) {
    return {
      action: "skip",
      reason: "analysis_disabled",
      message: `Local entry ${payload.entry_id} has analysis disabled.`,
    };
  }

  if (payload.source_text_hash !== localEntry.source_text_hash) {
    return {
      action: "conflict",
      code: "source_hash_mismatch",
      message:
        "Local entry source hash changed after this sync job was queued.",
    };
  }

  if (payload.local_revision !== localEntry.updatedAt) {
    return {
      action: "conflict",
      code: "stale_local_revision",
      message:
        "Local entry revision changed after this sync job was queued.",
    };
  }

  return {
    action: "sync",
  };
}
