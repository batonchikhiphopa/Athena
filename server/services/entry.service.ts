import {
  createEntry as createEntryRepository,
  deleteEntry as deleteEntryRepository,
  listEntries as listEntriesRepository,
  getEntryById as getEntryByIdRepository,
  updateEntry as updateEntryRepository,
} from "../repositories/entry.repository.js";
import { insertSignalRow } from "../repositories/signal.repository.js";
import {
  sanitizeSignalCandidate,
  createFallbackSignal,
} from "./sanitization.service.js";
import {
  ACTIVE_MODEL,
  ACTIVE_PROMPT_VERSION,
  ACTIVE_SCHEMA_VERSION,
} from "../config/versions.js";
import type {
  EntryStatus,
  EntryView,
  ExtractionProvider,
  Signal,
  SignalMetadata,
} from "../core/types.js";
import type { AthenaDb } from "../db/sqlite.js";
import { withDbWriteTransaction } from "../db/sqlite.js";

type EntryInput = {
  client_entry_id: string;
  entry_date: string;
  tags?: string[];
  source_text_hash: string;
  signal: unknown;
  metadata?: Partial<SignalMetadata>;
};

type UpdateEntryInput = Omit<EntryInput, "client_entry_id">;

type AppendSignalInput = {
  source_text_hash: string;
  signal: unknown;
  metadata?: Partial<SignalMetadata>;
};

type SourceHashMismatchError = Error & {
  code?: "SOURCE_HASH_MISMATCH";
};

const DEFAULT_METADATA = {
  provider: "ollama",
  model: ACTIVE_MODEL,
  error_code: null,
} satisfies {
  provider: ExtractionProvider;
  model: string;
  error_code: string | null;
};

export async function createEntry(
  db: AthenaDb,
  input: EntryInput,
): Promise<number | undefined> {
  const now = new Date().toISOString();
  const signal = normalizeClientSignal(input.signal);
  const metadata = normalizeSignalMetadata(input.metadata);
  const finalStatus = getFinalStatus(signal);

  const entryToSave = {
    client_entry_id: input.client_entry_id,
    entry_date: input.entry_date,
    tags: input.tags ?? [],
    status: finalStatus,
    source_text_hash: input.source_text_hash,
    created_at: now,
    updated_at: now,
  };

  return withDbWriteTransaction(db, async (transactionDb) => {
    const existingEntry = await getEntryByIdRepository(
      transactionDb,
      input.client_entry_id,
    );

    if (existingEntry) {
      if (existingEntry.source_text_hash !== input.source_text_hash) {
        const error: SourceHashMismatchError = new Error(
          "source_text_hash mismatch",
        );
        error.code = "SOURCE_HASH_MISMATCH";
        throw error;
      }

      return existingEntry.id;
    }

    const entryId = await createEntryRepository(transactionDb, entryToSave);

    if (entryId === undefined) {
      throw new Error("entry_create_failed");
    }

    await insertSignalRow(transactionDb, {
      entryId,
      sourceTextHash: input.source_text_hash,
      signal,
      schemaVersion: metadata.schema_version,
      promptVersion: metadata.prompt_version,
      provider: metadata.provider,
      model: metadata.model,
      errorCode: metadata.error_code,
      createdAt: now,
    });

    return entryId;
  });
}

export async function listEntries(db: AthenaDb): Promise<EntryView[]> {
  return listEntriesRepository(db);
}

export async function getEntryById(
  db: AthenaDb,
  id: number | string,
): Promise<EntryView | null> {
  return getEntryByIdRepository(db, id);
}

export async function appendEntrySignal(
  db: AthenaDb,
  entryIdOrClientId: number | string,
  input: AppendSignalInput,
): Promise<EntryView | null> {
  const entry = await getEntryByIdRepository(db, entryIdOrClientId);

  if (!entry) return null;
  if (entry.source_text_hash !== input.source_text_hash) {
    const error: SourceHashMismatchError = new Error("source_text_hash mismatch");
    error.code = "SOURCE_HASH_MISMATCH";
    throw error;
  }

  const now = new Date().toISOString();
  const signal = normalizeClientSignal(input.signal);
  const metadata = normalizeSignalMetadata(input.metadata);
  const finalStatus = getFinalStatus(signal);

  await withDbWriteTransaction(db, async (transactionDb) => {
    await insertSignalRow(transactionDb, {
      entryId: entry.id,
      sourceTextHash: input.source_text_hash,
      signal,
      schemaVersion: metadata.schema_version,
      promptVersion: metadata.prompt_version,
      provider: metadata.provider,
      model: metadata.model,
      errorCode: metadata.error_code,
      createdAt: now,
    });

    await transactionDb.run(
      `
      UPDATE entries
      SET status = ?,
          updated_at = ?
      WHERE id = ?
      `,
      [finalStatus, now, entry.id],
    );
  });

  return getEntryByIdRepository(db, entry.id);
}

export async function updateEntry(
  db: AthenaDb,
  entryIdOrClientId: number | string,
  input: UpdateEntryInput,
): Promise<EntryView | null> {
  const entry = await getEntryByIdRepository(db, entryIdOrClientId);

  if (!entry) return null;

  const now = new Date().toISOString();
  const signal = normalizeClientSignal(input.signal);
  const metadata = normalizeSignalMetadata(input.metadata);
  const finalStatus = getFinalStatus(signal);

  const updated = await withDbWriteTransaction(db, async (transactionDb) => {
    const updatedEntry = await updateEntryRepository(transactionDb, entry.id, {
      entry_date: input.entry_date,
      tags: input.tags ?? [],
      status: finalStatus,
      source_text_hash: input.source_text_hash,
      updated_at: now,
    });

    if (!updatedEntry) return false;

    await insertSignalRow(transactionDb, {
      entryId: entry.id,
      sourceTextHash: input.source_text_hash,
      signal,
      schemaVersion: metadata.schema_version,
      promptVersion: metadata.prompt_version,
      provider: metadata.provider,
      model: metadata.model,
      errorCode: metadata.error_code,
      createdAt: now,
    });

    return true;
  });

  if (!updated) return null;

  return getEntryByIdRepository(db, entry.id);
}

export async function deleteEntry(
  db: AthenaDb,
  entryIdOrClientId: number | string,
): Promise<boolean> {
  const entry = await getEntryByIdRepository(db, entryIdOrClientId);

  if (!entry) return false;

  return withDbWriteTransaction(db, (transactionDb) =>
    deleteEntryRepository(transactionDb, entry.id),
  );
}

function normalizeClientSignal(signal: unknown): Signal {
  if (isFallbackSignal(signal)) {
    return createFallbackSignal();
  }

  const sanitized = sanitizeSignalCandidate(signal);

  if (!sanitized.ok) {
    return createFallbackSignal();
  }

  return sanitized.data;
}

function normalizeSignalMetadata(metadata?: Partial<SignalMetadata>): SignalMetadata {
  return {
    schema_version: metadata?.schema_version ?? ACTIVE_SCHEMA_VERSION,
    prompt_version: metadata?.prompt_version ?? ACTIVE_PROMPT_VERSION,
    provider: metadata?.provider ?? DEFAULT_METADATA.provider,
    model: metadata?.model ?? DEFAULT_METADATA.model,
    error_code: metadata?.error_code ?? DEFAULT_METADATA.error_code,
  };
}

function getFinalStatus(signal: Signal): EntryStatus {
  return signal.signal_quality === "fallback" ? "fallback" : "extracted";
}

function isFallbackSignal(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "signal_quality" in value &&
    value.signal_quality === "fallback"
  );
}
