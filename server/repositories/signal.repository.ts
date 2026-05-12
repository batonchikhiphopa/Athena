import type { EntryStatus, ExtractionProvider, Signal } from "../core/types.js";
import type { AthenaDb } from "../db/sqlite.js";

type SignalStatus = "fallback" | "extracted";

type SignalStatusRow = {
  signal_quality: string;
};

type SignalIdentityRow = {
  id: number;
};

type InsertSignalParams = {
  entryId: number;
  sourceTextHash: string;
  signal: Signal;
  schemaVersion: string;
  promptVersion: string;
  provider?: ExtractionProvider;
  model: string;
  errorCode?: string | null;
  createdAt: string;
};

type InsertSignalAndFinalizeEntryParams = InsertSignalParams & {
  finalStatus: EntryStatus;
};

export async function hasSignalForEntryHash(
  db: AthenaDb,
  entryId: number,
  sourceTextHash: string,
): Promise<boolean> {
  const row = await db.get<SignalIdentityRow>(
    `
    SELECT id
    FROM signals
    WHERE entry_id = ?
      AND source_text_hash = ?
    LIMIT 1
    `,
    [entryId, sourceTextHash],
  );

  return Boolean(row);
}

export async function getSignalStatusForEntryHash(
  db: AthenaDb,
  entryId: number,
  sourceTextHash: string,
): Promise<SignalStatus | null> {
  const row = await db.get<SignalStatusRow>(
    `
    SELECT signal_quality
    FROM signals
    WHERE entry_id = ?
      AND source_text_hash = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 1
    `,
    [entryId, sourceTextHash],
  );

  if (!row) return null;

  return row.signal_quality === "fallback" ? "fallback" : "extracted";
}

export async function insertSignalAndFinalizeEntry(
  db: AthenaDb,
  {
    entryId,
    sourceTextHash,
    signal,
    finalStatus,
    schemaVersion,
    promptVersion,
    provider = "ollama",
    model,
    errorCode = null,
    createdAt,
  }: InsertSignalAndFinalizeEntryParams,
): Promise<void> {
  await db.exec("BEGIN");

  try {
    await insertSignalRow(db, {
      entryId,
      sourceTextHash,
      signal,
      schemaVersion,
      promptVersion,
      provider,
      model,
      errorCode,
      createdAt,
    });

    await db.run(
      `
      UPDATE entries
      SET status = ?,
          updated_at = ?
      WHERE id = ?
      `,
      [finalStatus, createdAt, entryId],
    );

    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}

export async function insertSignalRow(
  db: AthenaDb,
  {
    entryId,
    sourceTextHash,
    signal,
    schemaVersion,
    promptVersion,
    provider = "ollama",
    model,
    errorCode = null,
    createdAt,
  }: InsertSignalParams,
): Promise<void> {
  await db.run(
    `
    INSERT INTO signals (
      entry_id,
      source_text_hash,
      topics,
      activities,
      markers,
      load,
      fatigue,
      focus,
      signal_quality,
      schema_version,
      prompt_version,
      provider,
      model,
      error_code,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entryId,
      sourceTextHash,
      JSON.stringify(signal.topics),
      JSON.stringify(signal.activities),
      JSON.stringify(signal.markers),
      signal.load,
      signal.fatigue,
      signal.focus,
      signal.signal_quality,
      schemaVersion,
      promptVersion,
      provider,
      model,
      errorCode,
      createdAt,
    ],
  );
}
