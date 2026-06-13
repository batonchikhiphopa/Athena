import { createEntry, updateServerEntry } from "../entries/entriesApi";
import type { LocalEntry, ServerEntry } from "../../types";

type EntryServerSyncApi = {
  createEntry: typeof createEntry;
  updateServerEntry: typeof updateServerEntry;
};

const defaultEntryServerSyncApi: EntryServerSyncApi = {
  createEntry,
  updateServerEntry,
};

export async function syncLocalEntryToServer(
  entry: LocalEntry,
  api = defaultEntryServerSyncApi,
): Promise<ServerEntry> {
  if (!entry.serverId) {
    return api.createEntry(buildCreatePayload(entry));
  }

  try {
    return await api.updateServerEntry(entry.serverId, buildUpdatePayload(entry));
  } catch (error) {
    if (!isHttpNotFound(error)) {
      throw error;
    }

    return api.createEntry(buildCreatePayload(entry));
  }
}

function buildCreatePayload(entry: LocalEntry) {
  return {
    client_entry_id: entry.id,
    entry_date: entry.entry_date,
    tags: entry.tags,
    source_text_hash: entry.source_text_hash,
    signal: entry.signals,
    metadata: entry.metadata,
  };
}

function buildUpdatePayload(entry: LocalEntry) {
  return {
    entry_date: entry.entry_date,
    tags: entry.tags,
    source_text_hash: entry.source_text_hash,
    signal: entry.signals,
    metadata: entry.metadata,
  };
}

function isHttpNotFound(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const status = (error as Record<string, unknown>).status;

  return status === 404;
}
