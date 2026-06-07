import type { EntryStatus, ExtractionProvider, Signal } from "../core/types.js";
import { withDbWriteTransaction, type AthenaDb } from "../db/sqlite.js";

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
  await withDbWriteTransaction(db, async (tx) => {
    await insertSignalRow(tx, {
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

    await tx.run(
      `
      UPDATE entries
      SET status = ?,
          updated_at = ?
      WHERE id = ?
      `,
      [finalStatus, createdAt, entryId],
    );
  });
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
      state_inference,
      emotion_signals,
      metric_confidence,
      entry_intent,
      structure_signal,
      temporal_context,
      quality_reason,
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      entryId,
      sourceTextHash,
      JSON.stringify(signal.topics),
      JSON.stringify(signal.activities),
      JSON.stringify(signal.markers),
      JSON.stringify(signal.state_inference),
      JSON.stringify(signal.emotion_signals),
      JSON.stringify(signal.metric_confidence),
      JSON.stringify(signal.entry_intent),
      JSON.stringify(signal.structure_signal),
      JSON.stringify(signal.temporal_context),
      signal.quality_reason,
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
