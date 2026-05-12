import type { EntryStatus, ExtractionProvider, Signal, SignalMetadata } from "../core/types.js";
import type { AthenaDb } from "../db/sqlite.js";

type EntryWrite = {
  client_entry_id?: string;
  entry_date: string;
  created_at?: string;
  updated_at: string;
  status: EntryStatus;
  tags: string[];
  source_text_hash: string;
};

type EntryJoinedRow = {
  id: number;
  client_entry_id: string;
  entry_date: string;
  created_at: string;
  updated_at: string;
  status: EntryStatus;
  tags: string | null;
  source_text_hash: string;
  signal_id: number | null;
  topics: string | null;
  activities: string | null;
  markers: string | null;
  load: number | null;
  fatigue: number | null;
  focus: number | null;
  signal_quality: Signal["signal_quality"] | null;
  schema_version: string | null;
  prompt_version: string | null;
  provider: ExtractionProvider | null;
  model: string | null;
  error_code: string | null;
  signal_created_at: string | null;
};

type EntryView = {
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

export async function createEntry(
  db: AthenaDb,
  entry: EntryWrite & Required<Pick<EntryWrite, "client_entry_id" | "created_at">>,
): Promise<number | undefined> {
  const query = `
    INSERT INTO entries (
      client_entry_id,
      entry_date,
      created_at,
      updated_at,
      status,
      tags,
      source_text_hash
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    entry.client_entry_id,
    entry.entry_date,
    entry.created_at,
    entry.updated_at,
    entry.status,
    JSON.stringify(entry.tags),
    entry.source_text_hash,
  ];

  const result = await db.run(query, params);

  return result.lastID;
}

export async function listEntries(db: AthenaDb): Promise<EntryView[]> {
  const rows = await db.all<EntryJoinedRow[]>(`
    SELECT
      e.id,
      e.client_entry_id,
      e.entry_date,
      e.created_at,
      e.updated_at,
      e.status,
      e.tags,
      e.source_text_hash,
      s.id AS signal_id,
      s.topics,
      s.activities,
      s.markers,
      s.load,
      s.fatigue,
      s.focus,
      s.signal_quality,
      s.schema_version,
      s.prompt_version,
      s.provider,
      s.model,
      s.error_code,
      s.created_at AS signal_created_at
    FROM entries e
    LEFT JOIN signals s
      ON s.id = (
        SELECT latest.id
        FROM signals latest
        WHERE latest.entry_id = e.id
        ORDER BY latest.created_at DESC, latest.id DESC
        LIMIT 1
      )
    ORDER BY e.entry_date DESC, e.created_at DESC
  `);

  return rows.map(mapEntryRow);
}

export async function getEntryById(
  db: AthenaDb,
  id: number | string,
): Promise<EntryView | null> {
  const row = await db.get<EntryJoinedRow>(
    `
    SELECT
      e.id,
      e.client_entry_id,
      e.entry_date,
      e.created_at,
      e.updated_at,
      e.status,
      e.tags,
      e.source_text_hash,
      s.id AS signal_id,
      s.topics,
      s.activities,
      s.markers,
      s.load,
      s.fatigue,
      s.focus,
      s.signal_quality,
      s.schema_version,
      s.prompt_version,
      s.provider,
      s.model,
      s.error_code,
      s.created_at AS signal_created_at
    FROM entries e
    LEFT JOIN signals s
      ON s.id = (
        SELECT latest.id
        FROM signals latest
        WHERE latest.entry_id = e.id
        ORDER BY latest.created_at DESC, latest.id DESC
        LIMIT 1
      )
    WHERE e.id = ? OR e.client_entry_id = ?
    `,
    [id, id],
  );

  if (!row) return null;

  return mapEntryRow(row);
}

export async function updateEntry(
  db: AthenaDb,
  entryId: number,
  entry: EntryWrite,
): Promise<boolean> {
  const result = await db.run(
    `
    UPDATE entries
    SET entry_date = ?,
        updated_at = ?,
        status = ?,
        tags = ?,
        source_text_hash = ?
    WHERE id = ?
    `,
    [
      entry.entry_date,
      entry.updated_at,
      entry.status,
      JSON.stringify(entry.tags),
      entry.source_text_hash,
      entryId,
    ],
  );

  return (result.changes ?? 0) > 0;
}

export async function deleteEntry(
  db: AthenaDb,
  entryId: number,
): Promise<boolean> {
  await db.run("DELETE FROM signal_overrides WHERE entry_id = ?", [entryId]);
  await db.run("DELETE FROM signals WHERE entry_id = ?", [entryId]);

  const result = await db.run("DELETE FROM entries WHERE id = ?", [entryId]);

  return (result.changes ?? 0) > 0;
}

export async function updateEntryStatus(
  db: AthenaDb,
  entryId: number,
  status: EntryStatus,
): Promise<void> {
  await db.run(
    `
    UPDATE entries
    SET status = ?,
        updated_at = ?
    WHERE id = ?
    `,
    [status, new Date().toISOString(), entryId],
  );
}

export async function markEntryFailed(
  db: AthenaDb,
  entryId: number,
): Promise<void> {
  await updateEntryStatus(db, entryId, "failed");
}

function mapEntryRow(row: EntryJoinedRow): EntryView {
  const signal: Signal | null = row.signal_id
    ? {
        topics: parseStringArray(row.topics),
        activities: parseStringArray(row.activities),
        markers: parseStringArray(row.markers),
        load: row.load,
        fatigue: row.fatigue,
        focus: row.focus,
        signal_quality: row.signal_quality ?? "fallback",
      }
    : null;

  const metadata: SignalMetadata | null = row.signal_id
    ? {
        schema_version: row.schema_version ?? "",
        prompt_version: row.prompt_version ?? "",
        provider: row.provider ?? "ollama",
        model: row.model ?? "",
        error_code: row.error_code ?? null,
        created_at: row.signal_created_at ?? undefined,
      }
    : null;

  return {
    id: row.id,
    client_entry_id: row.client_entry_id,
    entry_date: row.entry_date,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: row.status,
    tags: parseStringArray(row.tags),
    source_text_hash: row.source_text_hash,
    signal,
    metadata,
  };
}

function parseStringArray(value: string | null): string[] {
  const parsed: unknown = JSON.parse(value || "[]");
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
}
