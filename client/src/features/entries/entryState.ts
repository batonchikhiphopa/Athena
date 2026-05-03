import type {
  EntrySortDirection,
  EntryView,
  LocalEntry,
  ServerEntry,
  SignalMetadata,
} from "../../types";

export function mergeEntryState(
  localEntry: LocalEntry,
  serverEntry: ServerEntry | null,
): EntryView {
  const preferLocal =
    localEntry.sync_status === "pending_reextract" ||
    localEntry.sync_status === "syncing" ||
    localEntry.sync_status === "local_only";
  const signal = preferLocal
    ? localEntry.signals
    : serverEntry?.signal ?? localEntry.signals;
  const metadata = normalizeMetadata(
    preferLocal
      ? localEntry.metadata
      : serverEntry?.metadata ?? localEntry.metadata,
  );

  return {
    id: localEntry.id,
    serverId: serverEntry?.id ?? localEntry.serverId ?? null,
    text: localEntry.text,
    textUnavailable: false,
    entryDate: preferLocal
      ? localEntry.entry_date
      : serverEntry?.entry_date ?? localEntry.entry_date,
    tags: preferLocal ? localEntry.tags : serverEntry?.tags ?? localEntry.tags,
    analysisEnabled: localEntry.analysis_enabled ?? true,
    sourceTextHash: preferLocal
      ? localEntry.source_text_hash
      : serverEntry?.source_text_hash ?? localEntry.source_text_hash,
    signals: signal,
    metadata,
    syncStatus: localEntry.sync_status,
    createdAt: preferLocal
      ? localEntry.createdAt
      : serverEntry?.created_at ?? localEntry.createdAt,
    updatedAt: preferLocal
      ? localEntry.updatedAt
      : serverEntry?.updated_at ?? localEntry.updatedAt,
  };
}

export function sortEntries(
  entriesToSort: EntryView[],
  direction: EntrySortDirection,
) {
  return [...entriesToSort].sort((left, right) =>
    compareEntries(left, right, direction),
  );
}

function normalizeMetadata(metadata: SignalMetadata) {
  return {
    schema_version: metadata.schema_version,
    prompt_version: metadata.prompt_version,
    provider: metadata.provider ?? "ollama",
    model: metadata.model,
    error_code: metadata.error_code ?? null,
    created_at: metadata.created_at,
  };
}

function compareEntries(
  left: EntryView,
  right: EntryView,
  direction: EntrySortDirection,
) {
  const dateOrder =
    direction === "desc"
      ? right.entryDate.localeCompare(left.entryDate)
      : left.entryDate.localeCompare(right.entryDate);
  if (dateOrder !== 0) return dateOrder;

  return direction === "desc"
    ? right.createdAt.localeCompare(left.createdAt)
    : left.createdAt.localeCompare(right.createdAt);
}
