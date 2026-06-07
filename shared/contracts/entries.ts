import type { Signal, SignalMetadata } from "./signal.js";

export type EntryStatus = "extracted" | "fallback" | "failed";

export type ServerEntry = {
  id: number;
  client_entry_id: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  status: EntryStatus;
  tags: string[];
  source_text_hash: string;
  signal: Signal | null;
  metadata: SignalMetadata | null;
};
