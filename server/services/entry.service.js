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

const DEFAULT_METADATA = {
  provider: "ollama",
  model: ACTIVE_MODEL,
  error_code: null,
};

export async function createEntry(db, input) {
  const now = new Date().toISOString();
  const signal = normalizeClientSignal(input.signal);
  const metadata = normalizeSignalMetadata(input.metadata);
  const finalStatus =
    signal.signal_quality === "fallback" ? "fallback" : "extracted";

  const entryToSave = {
    client_entry_id: input.client_entry_id,
    entry_date: input.entry_date,
    tags: input.tags ?? [],
    status: finalStatus,
    source_text_hash: input.source_text_hash,
    created_at: now,
    updated_at: now,
  };

  await db.exec("BEGIN");

  try {
    const entryId = await createEntryRepository(db, entryToSave);

    await insertSignalRow(db, {
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

    await db.exec("COMMIT");

    return entryId;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function listEntries(db) {
  return listEntriesRepository(db);
}

export async function getEntryById(db, id) {
  return getEntryByIdRepository(db, id);
}

export async function appendEntrySignal(db, entryIdOrClientId, input) {
  const entry = await getEntryByIdRepository(db, entryIdOrClientId);

  if (!entry) return null;
  if (entry.source_text_hash !== input.source_text_hash) {
    const error = new Error("source_text_hash mismatch");
    error.code = "SOURCE_HASH_MISMATCH";
    throw error;
  }

  const now = new Date().toISOString();
  const signal = normalizeClientSignal(input.signal);
  const metadata = normalizeSignalMetadata(input.metadata);
  const finalStatus =
    signal.signal_quality === "fallback" ? "fallback" : "extracted";

  await db.exec("BEGIN");

  try {
    await insertSignalRow(db, {
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

    await db.run(
      `
      UPDATE entries
      SET status = ?,
          updated_at = ?
      WHERE id = ?
      `,
      [finalStatus, now, entry.id],
    );

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  return getEntryByIdRepository(db, entry.id);
}

export async function updateEntry(db, entryIdOrClientId, input) {
  const entry = await getEntryByIdRepository(db, entryIdOrClientId);

  if (!entry) return null;

  const now = new Date().toISOString();
  const signal = normalizeClientSignal(input.signal);
  const metadata = normalizeSignalMetadata(input.metadata);
  const finalStatus =
    signal.signal_quality === "fallback" ? "fallback" : "extracted";

  await db.exec("BEGIN");

  try {
    const updated = await updateEntryRepository(db, entry.id, {
      entry_date: input.entry_date,
      tags: input.tags ?? [],
      status: finalStatus,
      source_text_hash: input.source_text_hash,
      updated_at: now,
    });

    if (!updated) {
      await db.exec("ROLLBACK");
      return null;
    }

    await insertSignalRow(db, {
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

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }

  return getEntryByIdRepository(db, entry.id);
}

export async function deleteEntry(db, entryIdOrClientId) {
  const entry = await getEntryByIdRepository(db, entryIdOrClientId);

  if (!entry) return false;

  await db.exec("BEGIN");

  try {
    const deleted = await deleteEntryRepository(db, entry.id);

    await db.exec("COMMIT");

    return deleted;
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

function normalizeClientSignal(signal) {
  if (signal?.signal_quality === "fallback") {
    return createFallbackSignal();
  }

  const sanitized = sanitizeSignalCandidate(signal);

  if (!sanitized.ok) {
    return createFallbackSignal();
  }

  return sanitized.data;
}

function normalizeSignalMetadata(metadata) {
  return {
    schema_version: metadata?.schema_version ?? ACTIVE_SCHEMA_VERSION,
    prompt_version: metadata?.prompt_version ?? ACTIVE_PROMPT_VERSION,
    provider: metadata?.provider ?? DEFAULT_METADATA.provider,
    model: metadata?.model ?? DEFAULT_METADATA.model,
    error_code: metadata?.error_code ?? DEFAULT_METADATA.error_code,
  };
}
