import type { Signal, SignalMetadata } from "../../shared/contracts";
import type { SelfReportEvent } from "../selfReports/selfReportTypes";

export type EntrySortDirection = "desc" | "asc";

export type LocalEntry = {
  id: string;
  serverId: number | null;
  text: string;
  entry_date: string;
  tags: string[];
  analysis_enabled: boolean;
  source_text_hash: string;
  signals: Signal;
  metadata: SignalMetadata;
  sync_status: "syncing" | "synced" | "local_only" | "pending_reextract";
  createdAt: string;
  updatedAt: string;
};

export type EntryView = {
  id: string;
  serverId: number | null;
  text: string;
  textUnavailable: boolean;
  entryDate: string;
  tags: string[];
  analysisEnabled: boolean;
  sourceTextHash: string;
  signals: Signal;
  metadata: SignalMetadata;
  syncStatus: LocalEntry["sync_status"];
  createdAt: string;
  updatedAt: string;
  isDraft?: boolean;
  selfReport?: SelfReportEvent | null;
};
